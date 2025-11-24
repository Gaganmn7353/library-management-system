import { bookModel } from '../models/bookModel.js';
import { formatSuccess, formatPagination } from '../utils/helpers.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getPaginationParams } from '../utils/helpers.js';
import logger from '../utils/logger.js';

export const bookController = {
  /**
   * Get all books with pagination, filters, and sorting
   * Supports both new format (search, category) and legacy format (q, subject)
   */
  getAll: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req.query);
    
    // Support both 'q' (legacy) and 'search' (new) for frontend compatibility
    const search = req.query.q || req.query.search;
    // Support both 'subject' (legacy) and 'category' (new)
    const category = req.query.subject || req.query.category;
    // Support both 'filter' parameter for search field selection
    const filter = req.query.filter || 'all';
    
    // Extract filters
    const filters = {
      search: search,
      category: category,
      author: req.query.author,
      publisher: req.query.publisher,
      available: req.query.available,
      publication_year_from: req.query.publication_year_from ? parseInt(req.query.publication_year_from, 10) : undefined,
      publication_year_to: req.query.publication_year_to ? parseInt(req.query.publication_year_to, 10) : undefined,
    };

    // Extract sorting parameters - support legacy 'sort' and 'order'
    let sortBy = req.query.sortBy || req.query.sort || 'title';
    let sortOrder = req.query.sortOrder || req.query.order || 'ASC';
    
    // Map legacy sort values
    if (sortBy === 'year') sortBy = 'publication_year';
    if (sortBy === 'popularity') sortBy = 'issue_count';

    const result = await bookModel.findAll({
      page,
      limit,
      offset,
      filters,
      sortBy,
      sortOrder,
    });

    // Transform books to match frontend expectations (subject instead of category, available_copies instead of available_quantity)
    const transformedBooks = result.books.map(book => ({
      ...book,
      subject: book.category || book.subject,
      available_copies: book.available_quantity || book.available_copies || 0,
      total_copies: book.quantity || book.total_copies || 0,
    }));

    res.json(
      formatSuccess(
        {
          books: transformedBooks,
          pagination: formatPagination(page, limit, result.total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get book by ID
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const book = await bookModel.findById(id);

    if (!book) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }

    // Transform to match frontend expectations
    const transformedBook = {
      ...book,
      subject: book.category || book.subject,
      available_copies: book.available_quantity || book.available_copies || 0,
      total_copies: book.quantity || book.total_copies || 0,
    };

    res.json(formatSuccess({ book: transformedBook }, MESSAGES.SUCCESS.RETRIEVED));
  }),

  /**
   * Create a new book
   * Supports both new format (category, quantity) and legacy format (subject, total_copies)
   */
  create: asyncHandler(async (req, res) => {
    // Map legacy format to new format
    const bookData = { ...req.body };
    
    // Map subject to category
    if (bookData.subject && !bookData.category) {
      bookData.category = bookData.subject;
    }
    
    // Map total_copies to quantity
    if (bookData.total_copies !== undefined && bookData.quantity === undefined) {
      bookData.quantity = bookData.total_copies;
      bookData.available_quantity = bookData.total_copies;
    }
    
    // Ensure available_quantity is set if quantity is provided
    if (bookData.quantity !== undefined && bookData.available_quantity === undefined) {
      bookData.available_quantity = bookData.quantity;
    }

    // Check if ISBN already exists
    if (bookData.isbn) {
      const existingBook = await bookModel.findByISBN(bookData.isbn);
      if (existingBook) {
        throw new AppError('Book with this ISBN already exists', HTTP_STATUS.CONFLICT);
      }
    }

    const book = await bookModel.create(bookData);

    logger.info(`Book created: ${book.title} by ${req.user?.username || 'system'}`);

    // Transform to match frontend expectations
    const transformedBook = {
      ...book,
      subject: book.category || book.subject,
      available_copies: book.available_quantity || book.available_copies || 0,
      total_copies: book.quantity || book.total_copies || 0,
    };

    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess({ book: transformedBook }, MESSAGES.SUCCESS.CREATED)
    );
  }),

  /**
   * Update book
   * Supports both new format (category, quantity) and legacy format (subject, total_copies)
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if book exists
    const existingBook = await bookModel.findById(id);
    if (!existingBook) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }

    // Map legacy format to new format
    const updateData = { ...req.body };
    
    // Map subject to category
    if (updateData.subject && !updateData.category) {
      updateData.category = updateData.subject;
      delete updateData.subject;
    }
    
    // Map total_copies to quantity
    if (updateData.total_copies !== undefined && updateData.quantity === undefined) {
      updateData.quantity = updateData.total_copies;
      // Calculate available_quantity based on current issued books
      const currentIssued = (existingBook.quantity || existingBook.total_copies || 0) - (existingBook.available_quantity || existingBook.available_copies || 0);
      updateData.available_quantity = Math.max(0, updateData.total_copies - currentIssued);
    }
    
    // Map available_copies to available_quantity
    if (updateData.available_copies !== undefined && updateData.available_quantity === undefined) {
      updateData.available_quantity = updateData.available_copies;
      delete updateData.available_copies;
    }

    // Check ISBN uniqueness if provided
    if (updateData.isbn && updateData.isbn !== existingBook.isbn) {
      const bookWithISBN = await bookModel.findByISBN(updateData.isbn);
      if (bookWithISBN) {
        throw new AppError('Book with this ISBN already exists', HTTP_STATUS.CONFLICT);
      }
    }

    const book = await bookModel.update(id, updateData);

    logger.info(`Book updated: ${book.title} by ${req.user?.username || 'system'}`);

    // Transform to match frontend expectations
    const transformedBook = {
      ...book,
      subject: book.category || book.subject,
      available_copies: book.available_quantity || book.available_copies || 0,
      total_copies: book.quantity || book.total_copies || 0,
    };

    res.json(formatSuccess({ book: transformedBook }, MESSAGES.SUCCESS.UPDATED));
  }),

  /**
   * Delete book (admin only)
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const book = await bookModel.findById(id);
    if (!book) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if book has active transactions
    const { query } = await import('../config/database.js');
    const activeTransactions = await query(
      'SELECT COUNT(*) as count FROM transactions WHERE book_id = $1 AND status IN ($2, $3)',
      [id, 'issued', 'overdue']
    );

    if (parseInt(activeTransactions.rows[0].count, 10) > 0) {
      throw new AppError('Cannot delete book with active transactions. Please wait for all books to be returned.', HTTP_STATUS.BAD_REQUEST);
    }

    await bookModel.delete(id);

    logger.info(`Book deleted: ${book.title} by ${req.user?.username || 'system'} (ID: ${req.user?.id || 'unknown'})`);

    res.status(HTTP_STATUS.OK).json(formatSuccess({ message: 'Book deleted successfully' }, MESSAGES.SUCCESS.DELETED));
  }),

  /**
   * Search books by query string
   */
  search: asyncHandler(async (req, res) => {
    const q = req.query.q || req.query.search;
    const { page, limit, offset } = getPaginationParams(req.query);

    if (!q || q.trim().length === 0) {
      return res.json(
        formatSuccess(
          {
            books: [],
            pagination: formatPagination(page, limit, 0),
            query: q?.trim() || '',
          },
          MESSAGES.SUCCESS.RETRIEVED
        )
      );
    }

    const result = await bookModel.search(q.trim(), { page, limit, offset });

    // Transform books to match frontend expectations
    const transformedBooks = result.books.map(book => ({
      ...book,
      subject: book.category || book.subject,
      available_copies: book.available_quantity || book.available_copies || 0,
      total_copies: book.quantity || book.total_copies || 0,
    }));

    res.json(
      formatSuccess(
        {
          books: transformedBooks,
          pagination: formatPagination(page, limit, result.total),
          query: q.trim(),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get books by category
   */
  getByCategory: asyncHandler(async (req, res) => {
    const { category } = req.params;
    const { page, limit, offset } = getPaginationParams(req.query);
    const sortBy = req.query.sortBy || 'title';
    const sortOrder = req.query.sortOrder || 'ASC';

    const result = await bookModel.findByCategory(category, { page, limit, offset, sortBy, sortOrder });

    res.json(
      formatSuccess(
        {
          books: result.books,
          pagination: formatPagination(page, limit, result.total),
          category: result.category,
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get all categories
   */
  getCategories: asyncHandler(async (req, res) => {
    const categories = await bookModel.getCategories();

    res.json(
      formatSuccess(
        {
          categories,
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Update book quantity (librarian only)
   */
  updateQuantity: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, available_quantity } = req.body;

    // Validate book exists
    const existingBook = await bookModel.findById(id);
    if (!existingBook) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }

    // Validate quantity
    if (quantity === undefined || quantity === null) {
      throw new AppError('Quantity is required', HTTP_STATUS.BAD_REQUEST);
    }

    if (quantity < 0) {
      throw new AppError('Quantity cannot be negative', HTTP_STATUS.BAD_REQUEST);
    }

    // Update quantity
    const book = await bookModel.updateQuantity(id, quantity, available_quantity);

    logger.info(`Book quantity updated: ${book.title} (ID: ${id}) - New quantity: ${quantity}, Available: ${book.available_quantity}`);

    res.json(
      formatSuccess(
        {
          book,
        },
        'Book quantity updated successfully'
      )
    );
  }),

  /**
   * Get available books
   */
  getAvailable: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req.query);
    const sortBy = req.query.sortBy || 'title';
    const sortOrder = req.query.sortOrder || 'ASC';
    
    const result = await bookModel.findAll({
      page,
      limit,
      offset,
      filters: { available: true },
      sortBy,
      sortOrder,
    });

    res.json(
      formatSuccess(
        {
          books: result.books,
          pagination: formatPagination(page, limit, result.total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),
};

