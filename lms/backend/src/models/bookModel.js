import { query } from '../config/database.js';

export const bookModel = {
  /**
   * Create a new book
   */
  async create(bookData) {
    const {
      title,
      author,
      isbn,
      publisher,
      publication_year,
      category,
      quantity = 0,
      available_quantity = null,
      description,
      cover_image_url,
    } = bookData;

    const availQty = available_quantity !== null ? available_quantity : quantity;

    const sql = `
      INSERT INTO books (
        title, author, isbn, publisher, publication_year,
        category, quantity, available_quantity, description, cover_image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const result = await query(sql, [
      title,
      author,
      isbn,
      publisher,
      publication_year,
      category,
      quantity,
      availQty,
      description,
      cover_image_url,
    ]);
    return result.rows[0];
  },

  /**
   * Find book by ID
   */
  async findById(id) {
    const sql = 'SELECT * FROM books WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Find book by ISBN
   */
  async findByISBN(isbn) {
    const sql = 'SELECT * FROM books WHERE isbn = $1';
    const result = await query(sql, [isbn]);
    return result.rows[0];
  },

  /**
   * Update book
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE books
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await query(sql, values);
    return result.rows[0];
  },

  /**
   * Delete book
   */
  async delete(id) {
    const sql = 'DELETE FROM books WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Get all books with pagination, filters, sorting, and search
   */
  async findAll({ page = 1, limit = 10, offset, filters = {}, sortBy = 'title', sortOrder = 'ASC' }) {
    const off = offset !== undefined ? offset : (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Search filter - searches in title, author, ISBN
    if (filters.search) {
      conditions.push(`(title ILIKE $${paramCount} OR author ILIKE $${paramCount} OR isbn ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    // Category filter
    if (filters.category) {
      conditions.push(`category = $${paramCount}`);
      values.push(filters.category);
      paramCount++;
    }

    // Author filter
    if (filters.author) {
      conditions.push(`author ILIKE $${paramCount}`);
      values.push(`%${filters.author}%`);
      paramCount++;
    }

    // Availability filter
    if (filters.available === 'true' || filters.available === true || filters.available === '1') {
      conditions.push(`available_quantity > 0`);
    } else if (filters.available === 'false' || filters.available === false || filters.available === '0') {
      conditions.push(`available_quantity = 0`);
    }

    // Publisher filter
    if (filters.publisher) {
      conditions.push(`publisher ILIKE $${paramCount}`);
      values.push(`%${filters.publisher}%`);
      paramCount++;
    }

    // Publication year range filter
    if (filters.publication_year_from) {
      conditions.push(`publication_year >= $${paramCount}`);
      values.push(filters.publication_year_from);
      paramCount++;
    }
    if (filters.publication_year_to) {
      conditions.push(`publication_year <= $${paramCount}`);
      values.push(filters.publication_year_to);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate and set sort column
    const allowedSortColumns = ['title', 'author', 'publication_year', 'created_at', 'category'];
    const sortColumn = allowedSortColumns.includes(sortBy.toLowerCase()) ? sortBy.toLowerCase() : 'title';
    
    // Validate sort order
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    values.push(limit, off);

    const sql = `
      SELECT * FROM books
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM books
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql, values.slice(0, -2)),
    ]);

    return {
      books: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Search books by query string (searches title, author, ISBN, description)
   */
  async search(queryString, { page = 1, limit = 10, offset } = {}) {
    const off = offset !== undefined ? offset : (page - 1) * limit;
    const searchTerm = `%${queryString}%`;
    
    const sql = `
      SELECT * FROM books
      WHERE title ILIKE $1
         OR author ILIKE $1
         OR isbn ILIKE $1
         OR description ILIKE $1
         OR publisher ILIKE $1
      ORDER BY 
        CASE 
          WHEN title ILIKE $1 THEN 1
          WHEN author ILIKE $1 THEN 2
          WHEN isbn = $2 THEN 3
          ELSE 4
        END,
        title ASC
      LIMIT $3 OFFSET $4
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM books
      WHERE title ILIKE $1
         OR author ILIKE $1
         OR isbn ILIKE $1
         OR description ILIKE $1
         OR publisher ILIKE $1
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, [searchTerm, queryString, limit, off]),
      query(countSql, [searchTerm]),
    ]);

    return {
      books: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Get books by category
   */
  async findByCategory(category, { page = 1, limit = 10, offset, sortBy = 'title', sortOrder = 'ASC' } = {}) {
    const off = offset !== undefined ? offset : (page - 1) * limit;
    
    const allowedSortColumns = ['title', 'author', 'publication_year', 'created_at'];
    const sortColumn = allowedSortColumns.includes(sortBy.toLowerCase()) ? sortBy.toLowerCase() : 'title';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const sql = `
      SELECT * FROM books
      WHERE category = $1
      ORDER BY ${sortColumn} ${order}
      LIMIT $2 OFFSET $3
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM books
      WHERE category = $1
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, [category, limit, off]),
      query(countSql, [category]),
    ]);

    return {
      books: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      category,
    };
  },

  /**
   * Get all unique categories
   */
  async getCategories() {
    const sql = `
      SELECT DISTINCT category, COUNT(*) as book_count
      FROM books
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY category ASC
    `;
    const result = await query(sql);
    return result.rows;
  },

  /**
   * Check if book is available
   */
  async isAvailable(id) {
    const sql = 'SELECT available_quantity FROM books WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0]?.available_quantity > 0;
  },

  /**
   * Update book availability (increment/decrement)
   */
  async updateAvailability(id, increment = 1) {
    const sql = `
      UPDATE books
      SET available_quantity = GREATEST(0, available_quantity + $1),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [increment, id]);
    return result.rows[0];
  },

  /**
   * Update book quantity and available quantity
   */
  async updateQuantity(id, quantity, available_quantity = null) {
    const availQty = available_quantity !== null ? available_quantity : quantity;
    
    // Ensure available_quantity doesn't exceed quantity
    const sql = `
      UPDATE books
      SET quantity = $1,
          available_quantity = LEAST($2, $1),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await query(sql, [quantity, availQty, id]);
    return result.rows[0];
  },
};

