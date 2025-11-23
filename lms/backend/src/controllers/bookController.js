import { bookModel } from '../models/bookModel.js';
import { formatSuccess, formatPagination } from '../utils/helpers.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { getPaginationParams } from '../utils/helpers.js';
import logger from '../utils/logger.js';

export const bookController = {
  /**
   * Get all books with pagination, filters, and sorting
   */
  getAll: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req.query);
    
    // Extract filters
    const filters = {
      search: req.query.search,
      category: req.query.category,
      author: req.query.author,
      publisher: req.query.publisher,
      available: req.query.available,
      publication_year_from: req.query.publication_year_from ? parseInt(req.query.publication_year_from, 10) : undefined,
      publication_year_to: req.query.publication_year_to ? parseInt(req.query.publication_year_to, 10) : undefined,
    };

    // Extract sorting parameters
    const sortBy = req.query.sortBy || 'title';
    const sortOrder = req.query.sortOrder || 'ASC';

    const result = await bookModel.findAll({
      page,
      limit,
      offset,
      filters,
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

  /**
   * Get book by ID
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const book = await bookModel.findById(id);

    if (!book) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }

    res.json(formatSuccess({ book }, MESSAGES.SUCCESS.RETRIEVED));
  }),

  /**
   * Create a new book
   */
  create: asyncHandler(async (req, res) => {
    // Check if ISBN already exists
    if (req.body.isbn) {
      const existingBook = await bookModel.findByISBN(req.body.isbn);
      if (existingBook) {
        throw new AppError('Book with this ISBN already exists', HTTP_STATUS.CONFLICT);
      }
    }

    const book = await bookModel.create(req.body);

    logger.info(`Book created: ${book.title} by ${req.user.username}`);

    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess({ book }, MESSAGES.SUCCESS.CREATED)
    );
  }),

  /**
   * Update book
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if book exists
    const existingBook = await bookModel.findById(id);
    if (!existingBook) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check ISBN uniqueness if provided
    if (req.body.isbn && req.body.isbn !== existingBook.isbn) {
      const bookWithISBN = await bookModel.findByISBN(req.body.isbn);
      if (bookWithISBN) {
        throw new AppError('Book with this ISBN already exists', HTTP_STATUS.CONFLICT);
      }
    }

    const book = await bookModel.update(id, req.body);

    logger.info(`Book updated: ${book.title} by ${req.user.username}`);

    res.json(formatSuccess({ book }, MESSAGES.SUCCESS.UPDATED));
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

    logger.info(`Book deleted: ${book.title} by ${req.user.username} (ID: ${req.user.id})`);

    res.status(HTTP_STATUS.NO_CONTENT).send();
  }),

  /**
   * Search books by query string
   */
  search: asyncHandler(async (req, res) => {
    const { q } = req.query;
    const { page, limit, offset } = getPaginationParams(req.query);

    if (!q || q.trim().length === 0) {
      throw new AppError('Search query is required', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await bookModel.search(q.trim(), { page, limit, offset });

    res.json(
      formatSuccess(
        {
          books: result.books,
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

