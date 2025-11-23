import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const memberSchema = z.object({
  member_id: z.string().min(1, 'Member ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  member_type: z.enum(['student', 'faculty', 'public']),
  status: z.enum(['active', 'inactive']).optional(),
});

export default function AddMember() {
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
    resolver: zodResolver(memberSchema),
    defaultValues: {
      status: 'active',
    },
  });

  useEffect(() => {
    if (isEdit) {
      fetchMember();
    }
  }, [id]);

  const fetchMember = async () => {
    try {
      const response = await api.get(`/members/${id}`);
      const member = response.data;
      setValue('member_id', member.member_id);
      setValue('name', member.name);
      setValue('email', member.email);
      setValue('phone', member.phone || '');
      setValue('member_type', member.member_type);
      setValue('status', member.status);
    } catch (error) {
      toast.error('Failed to load member');
      navigate('/members');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/members/${id}`, data);
        toast.success('Member updated successfully');
      } else {
        await api.post('/members', {
          ...data,
          registration_date: new Date().toISOString().split('T')[0],
        });
        toast.success('Member added successfully');
      }
      navigate('/members');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/members')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Members</span>
        </button>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {isEdit ? 'Edit Member' : 'Add New Member'}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Member ID *
              </label>
              <input
                {...register('member_id')}
                type="text"
                className="input-field"
                placeholder="e.g., STU001, FAC001"
                disabled={isEdit}
              />
              {errors.member_id && (
                <p className="text-red-500 text-sm mt-1">{errors.member_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="input-field"
                placeholder="Enter member name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                {...register('email')}
                type="email"
                className="input-field"
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="input-field"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Member Type *
              </label>
              <select {...register('member_type')} className="input-field">
                <option value="">Select type</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="public">Public</option>
              </select>
              {errors.member_type && (
                <p className="text-red-500 text-sm mt-1">{errors.member_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select {...register('status')} className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Member' : 'Add Member'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/members')}
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
