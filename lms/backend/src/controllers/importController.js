import ExcelJS from 'exceljs';
import { getClient } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Validate book row data
 */
const validateBookRow = (row, rowNumber) => {
  const errors = [];
  const book = {};

  // Required fields
  if (!row.title || typeof row.title !== 'string' || row.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (row.title.trim().length > 500) {
    errors.push('Title must be less than 500 characters');
  } else {
    book.title = row.title.trim();
  }

  if (!row.author || typeof row.author !== 'string' || row.author.trim().length === 0) {
    errors.push('Author is required');
  } else if (row.author.trim().length > 255) {
    errors.push('Author must be less than 255 characters');
  } else {
    book.author = row.author.trim();
  }

  if (!row.isbn || typeof row.isbn !== 'string' || row.isbn.trim().length === 0) {
    errors.push('ISBN is required');
  } else if (row.isbn.trim().length > 20) {
    errors.push('ISBN must be less than 20 characters');
  } else {
    book.isbn = row.isbn.trim();
  }

  // Optional fields
  if (row.publisher) {
    if (typeof row.publisher !== 'string' || row.publisher.trim().length > 255) {
      errors.push('Publisher must be less than 255 characters');
    } else {
      book.publisher = row.publisher.trim();
    }
  }

  if (row.publication_year) {
    const year = parseInt(row.publication_year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1000 || year > currentYear + 1) {
      errors.push(`Invalid publication year: ${row.publication_year}`);
    } else {
      book.publication_year = year;
    }
  }

  if (row.category) {
    if (typeof row.category !== 'string' || row.category.trim().length > 100) {
      errors.push('Category must be less than 100 characters');
    } else {
      book.category = row.category.trim();
    }
  }

  if (row.quantity !== undefined && row.quantity !== null && row.quantity !== '') {
    const qty = parseInt(row.quantity);
    if (isNaN(qty) || qty < 0) {
      errors.push(`Invalid quantity: ${row.quantity}`);
    } else {
      book.quantity = qty;
    }
  } else {
    book.quantity = 0;
  }

  if (row.available_quantity !== undefined && row.available_quantity !== null && row.available_quantity !== '') {
    const availQty = parseInt(row.available_quantity);
    if (isNaN(availQty) || availQty < 0) {
      errors.push(`Invalid available quantity: ${row.available_quantity}`);
    } else {
      book.available_quantity = availQty;
    }
  } else {
    book.available_quantity = book.quantity;
  }

  if (row.description) {
    if (typeof row.description !== 'string') {
      errors.push('Description must be a string');
    } else {
      book.description = row.description.trim();
    }
  }

  if (row.cover_image_url) {
    if (typeof row.cover_image_url !== 'string') {
      errors.push('Cover image URL must be a string');
    } else {
      const url = row.cover_image_url.trim();
      try {
        new URL(url); // Validate URL format
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          errors.push('Cover image URL must start with http:// or https://');
        } else {
          book.cover_image_url = url;
        }
      } catch (e) {
        errors.push('Invalid cover image URL format');
      }
    }
  }

  return { book, errors, rowNumber };
};

/**
 * Parse Excel file and extract book data
 */
const parseExcelFile = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Get first worksheet
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new AppError('Excel file is empty or invalid', 400);
  }

  const rows = [];
  let headerRow = null;

  // Process rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // Header row - extract column names
      headerRow = row.values.map((val) => (val ? String(val).toLowerCase().trim() : ''));
    } else {
      // Data rows
      const rowData = {};
      row.values.forEach((val, index) => {
        if (index > 0 && headerRow[index]) {
          // Skip first empty cell and map to header
          const key = headerRow[index];
          rowData[key] = val !== null && val !== undefined ? val : '';
        }
      });

      // Only add row if it has at least one non-empty value
      if (Object.values(rowData).some((v) => v !== '' && v !== null && v !== undefined)) {
        rows.push({ ...rowData, _rowNumber: rowNumber });
      }
    }
  });

  return rows;
};

/**
 * Import books from Excel file
 */
export const importBooks = async (req, res, next) => {
  const client = await getClient();
  let transactionStarted = false;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { duplicateAction = 'skip' } = req.body; // 'skip' or 'update'
    const fileBuffer = req.file.buffer;

    // Parse Excel file
    logger.info('Parsing Excel file...');
    const rows = await parseExcelFile(fileBuffer);

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in Excel file',
      });
    }

    logger.info(`Found ${rows.length} rows to process`);

    // Start transaction
    await client.query('BEGIN');
    transactionStarted = true;

    const results = {
      total: rows.length,
      success: 0,
      failed: 0,
      skipped: 0,
      updated: 0,
      errors: [],
    };

    // Process each row
    for (const row of rows) {
      const rowNumber = row._rowNumber || 'unknown';

      try {
        // Validate row
        const { book, errors } = validateBookRow(row, rowNumber);

        if (errors.length > 0) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            data: row,
            errors: errors,
          });
          continue;
        }

        // Check for duplicate ISBN using transaction client
        const existingBookResult = await client.query('SELECT * FROM books WHERE isbn = $1', [book.isbn]);
        const existingBook = existingBookResult.rows[0];

        if (existingBook) {
          if (duplicateAction === 'update') {
            // Update existing book using transaction client
            const availQty = book.available_quantity !== null ? book.available_quantity : book.quantity;
            await client.query(
              `UPDATE books 
               SET title = $1, author = $2, publisher = $3, publication_year = $4,
                   category = $5, quantity = $6, available_quantity = $7,
                   description = $8, cover_image_url = $9, updated_at = CURRENT_TIMESTAMP
               WHERE id = $10`,
              [
                book.title,
                book.author,
                book.publisher || null,
                book.publication_year || null,
                book.category || null,
                book.quantity,
                availQty,
                book.description || null,
                book.cover_image_url || null,
                existingBook.id,
              ]
            );

            results.updated++;
            logger.debug(`Updated book: ${book.isbn} (Row ${rowNumber})`);
          } else {
            // Skip duplicate
            results.skipped++;
            results.errors.push({
              row: rowNumber,
              data: row,
              errors: [`Duplicate ISBN: ${book.isbn} (existing book ID: ${existingBook.id})`],
            });
          }
        } else {
          // Insert new book using transaction client
          const availQty = book.available_quantity !== null ? book.available_quantity : book.quantity;
          await client.query(
            `INSERT INTO books (
              title, author, isbn, publisher, publication_year,
              category, quantity, available_quantity, description, cover_image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              book.title,
              book.author,
              book.isbn,
              book.publisher || null,
              book.publication_year || null,
              book.category || null,
              book.quantity,
              availQty,
              book.description || null,
              book.cover_image_url || null,
            ]
          );

          results.success++;
          logger.debug(`Created book: ${book.isbn} (Row ${rowNumber})`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          data: row,
          errors: [error.message || 'Unknown error'],
        });
        logger.error(`Error processing row ${rowNumber}:`, error);
      }
    }

    // Check if we should commit or rollback
    const hasCriticalErrors = results.failed > results.total * 0.5; // More than 50% errors

    if (hasCriticalErrors) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: 'Import failed due to too many errors. Transaction rolled back.',
        data: results,
      });
    }

    // Commit transaction
    await client.query('COMMIT');
    transactionStarted = false;

    logger.info(`Import completed: ${results.success} created, ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);

    res.status(200).json({
      success: true,
      message: `Import completed: ${results.success} books created, ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    // Rollback transaction if started
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logger.error('Error during rollback:', rollbackError);
      }
    }

    logger.error('Error importing books:', error);

    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Failed to import books from Excel file', 500));
    }
  } finally {
    client.release();
  }
};

/**
 * Download Excel template for book import
 */
export const downloadBookTemplate = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Books Template');

    // Define headers
    const headers = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Author', key: 'author', width: 25 },
      { header: 'ISBN', key: 'isbn', width: 20 },
      { header: 'Publisher', key: 'publisher', width: 25 },
      { header: 'Publication Year', key: 'publication_year', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Available Quantity', key: 'available_quantity', width: 18 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Cover Image URL', key: 'cover_image_url', width: 50 },
    ];

    worksheet.columns = headers;

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add example row
    worksheet.addRow({
      title: 'Example Book Title',
      author: 'Example Author',
      isbn: '978-0-123456-78-9',
      publisher: 'Example Publisher',
      publication_year: 2023,
      category: 'Fiction',
      quantity: 10,
      available_quantity: 10,
      description: 'This is an example book description',
      cover_image_url: 'https://example.com/book-cover.jpg',
    });

    // Add instructions row
    worksheet.addRow({
      title: 'INSTRUCTIONS:',
      author: '',
      isbn: '',
      publisher: '',
      publication_year: '',
      category: '',
      quantity: '',
      available_quantity: '',
      description: '',
      cover_image_url: '',
    });

    worksheet.addRow({
      title: '1. Required fields: Title, Author, ISBN',
      author: '',
      isbn: '',
      publisher: '',
      publication_year: '',
      category: '',
      quantity: '',
      available_quantity: '',
      description: '',
      cover_image_url: '',
    });

    worksheet.addRow({
      title: '2. Optional fields: All other fields',
      author: '',
      isbn: '',
      publisher: '',
      publication_year: '',
      category: '',
      quantity: '',
      available_quantity: '',
      description: '',
      cover_image_url: '',
    });

    worksheet.addRow({
      title: '3. For duplicates: Set duplicateAction=update in request body to update existing books',
      author: '',
      isbn: '',
      publisher: '',
      publication_year: '',
      category: '',
      quantity: '',
      available_quantity: '',
      description: '',
      cover_image_url: '',
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="book_import_template.xlsx"');

    // Send file
    res.send(buffer);

    logger.info('Book import template downloaded');
  } catch (error) {
    logger.error('Error generating template:', error);
    next(new AppError('Failed to generate template', 500));
  }
};

export const importController = {
  importBooks,
  downloadBookTemplate,
};

