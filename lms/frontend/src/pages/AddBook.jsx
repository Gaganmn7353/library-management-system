import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const bookSchema = z.object({
  isbn: z.string().min(10, 'ISBN must be at least 10 characters'),
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  subject: z.string().min(1, 'Subject is required'),
  publisher: z.string().optional(),
  publication_year: z.number().min(1000).max(2100).optional().or(z.literal('')),
  total_copies: z.number().min(1, 'At least 1 copy is required'),
  shelf_location: z.string().optional(),
});

export default function AddBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(bookSchema),
  });

  useEffect(() => {
    if (isEdit) {
      fetchBook();
    }
  }, [id]);

  const fetchBook = async () => {
    try {
      console.log('[AddBook] Fetching book for edit', { id });
      const response = await api.get(`/books/${id}`);
      // Backend returns { success, message, data: { book } }
      const data = response.data?.data || response.data;
      const book = data?.book || data;
      setValue('isbn', book.isbn);
      setValue('title', book.title);
      setValue('author', book.author);
      setValue('subject', book.subject);
      setValue('publisher', book.publisher || '');
      setValue('publication_year', book.publication_year || '');
      setValue('total_copies', book.total_copies);
      setValue('shelf_location', book.shelf_location || '');
    } catch (error) {
      toast.error('Failed to load book');
      navigate('/books');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log('[AddBook] Submitting form', { isEdit, payload: data });
      if (isEdit) {
        await api.put(`/books/${id}`, {
          ...data,
          publication_year: data.publication_year || null,
        });
        toast.success('Book updated successfully');
      } else {
        await api.post('/books', {
          ...data,
          publication_year: data.publication_year || null,
        });
        toast.success('Book added successfully');
      }
      navigate('/books');
    } catch (error) {
      console.error('[AddBook] Failed to save book', error);
      toast.error(error.response?.data?.error || 'Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  const subjects = [
    'Fiction',
    'Non-Fiction',
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Business',
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/books')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Books</span>
        </button>

        <div className="card">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            {isEdit ? 'Edit Book' : 'Add New Book'}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ISBN *
              </label>
              <input
                {...register('isbn')}
                type="text"
                className="input-field"
                placeholder="Enter ISBN"
              />
              {errors.isbn && (
                <p className="text-red-500 text-sm mt-1">{errors.isbn.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="input-field"
                placeholder="Enter book title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Author *
              </label>
              <input
                {...register('author')}
                type="text"
                className="input-field"
                placeholder="Enter author name"
              />
              {errors.author && (
                <p className="text-red-500 text-sm mt-1">{errors.author.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject/Category *
              </label>
              <select {...register('subject')} className="input-field">
                <option value="">Select subject</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              {errors.subject && (
                <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Publisher
              </label>
              <input
                {...register('publisher')}
                type="text"
                className="input-field"
                placeholder="Enter publisher name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Publication Year
              </label>
              <input
                {...register('publication_year', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="Enter publication year"
              />
              {errors.publication_year && (
                <p className="text-red-500 text-sm mt-1">{errors.publication_year.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Copies *
              </label>
              <input
                {...register('total_copies', { valueAsNumber: true })}
                type="number"
                min="1"
                className="input-field"
                placeholder="Enter total copies"
              />
              {errors.total_copies && (
                <p className="text-red-500 text-sm mt-1">{errors.total_copies.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shelf Location
              </label>
              <input
                {...register('shelf_location')}
                type="text"
                className="input-field"
                placeholder="e.g., A-101, CS-205"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Book' : 'Add Book'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/books')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}