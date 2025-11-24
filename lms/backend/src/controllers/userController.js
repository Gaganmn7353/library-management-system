import bcrypt from 'bcrypt';
import config from '../config/env.js';
import { HTTP_STATUS } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { userModel } from '../models/userModel.js';
import { memberModel } from '../models/memberModel.js';
import { query } from '../config/database.js';

const SALT_ROUNDS = config.bcrypt.saltRounds || 10;
const STATUS_VALUES = ['active', 'inactive', 'deleted'];

const buildMemberId = () => `MEM${Date.now()}`;

export const userController = {
  getUsers: asyncHandler(async (req, res) => {
    const { search, role, status } = req.query;

    const conditions = ['u.status != $1'];
    const values = ['deleted'];
    let idx = 2;

    if (search) {
      conditions.push(`(u.username ILIKE $${idx} OR u.email ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (role) {
      conditions.push(`u.role = $${idx}`);
      values.push(role);
      idx++;
    }

    if (status) {
      conditions.push(`u.status = $${idx}`);
      values.push(status);
      idx++;
    }

    const sql = `
      SELECT 
        u.id, u.username, u.email, u.role, u.status, u.last_login, u.updated_at, u.created_at,
        m.member_id, m.status AS member_status, m.member_type
      FROM users u
      LEFT JOIN members m ON m.user_id = u.id
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY u.created_at DESC
    `;

    const result = await query(sql, values);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        users: result.rows,
      },
    });
  }),

  getUserById: asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.params.id);
    if (!user || user.status === 'deleted') {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const member = await query(
      'SELECT member_id, status AS member_status, member_type FROM members WHERE user_id = $1',
      [user.id],
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user: {
          ...user,
          member: member.rows[0] || null,
        },
      },
    });
  }),

  createUser: asyncHandler(async (req, res) => {
    const { username, password, email, role = 'member', status = 'active', phone, address } = req.body;

    if (!username || !password || !email) {
      throw new AppError('Username, password, and email are required', HTTP_STATUS.BAD_REQUEST);
    }

    if (!STATUS_VALUES.includes(status)) {
      throw new AppError('Invalid status value', HTTP_STATUS.BAD_REQUEST);
    }

    const existingUsername = await userModel.findByUsername(username);
    if (existingUsername) {
      throw new AppError('Username already exists', HTTP_STATUS.CONFLICT);
    }

    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await userModel.create({
      username,
      email,
      password_hash,
      role,
      status,
      updated_by: req.user?.id || null,
    });

    let memberProfile = null;
    if (role === 'member') {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setFullYear(expiry.getFullYear() + 1);

      memberProfile = await memberModel.create({
        user_id: newUser.id,
        member_id: buildMemberId(),
        phone,
        address,
        membership_date: now,
        membership_expiry: expiry,
        status: 'active',
        member_type: 'regular',
      });
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        user: newUser,
        member: memberProfile,
      },
    });
  }),

  updateUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, email, role, status } = req.body;

    const user = await userModel.findById(id);
    if (!user || user.status === 'deleted') {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (username && username !== user.username) {
      const exists = await userModel.findByUsername(username);
      if (exists && exists.id !== user.id) {
        throw new AppError('Username already exists', HTTP_STATUS.CONFLICT);
      }
    }

    if (email && email !== user.email) {
      const exists = await userModel.findByEmail(email);
      if (exists && exists.id !== user.id) {
        throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
      }
    }

    if (status && !STATUS_VALUES.includes(status)) {
      throw new AppError('Invalid status value', HTTP_STATUS.BAD_REQUEST);
    }

    const updatedUser = await userModel.update(id, {
      username,
      email,
      role,
      status,
      updated_by: req.user?.id || user.updated_by,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { user: updatedUser },
    });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!STATUS_VALUES.includes(status)) {
      throw new AppError('Invalid status value', HTTP_STATUS.BAD_REQUEST);
    }

    const user = await userModel.findById(id);
    if (!user || user.status === 'deleted') {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const updatedUser = await userModel.update(id, {
      status,
      updated_by: req.user?.id || user.updated_by,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { user: updatedUser },
    });
  }),

  deleteUser: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user || user.status === 'deleted') {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const member = await query('SELECT id FROM members WHERE user_id = $1', [id]);
    if (member.rows[0]) {
      const activeTransactions = await query(
        'SELECT COUNT(*) AS count FROM transactions WHERE member_id = $1 AND status IN ($2, $3)',
        [member.rows[0].id, 'issued', 'overdue'],
      );
      if (parseInt(activeTransactions.rows[0].count, 10) > 0) {
        throw new AppError('Cannot delete user with active transactions', HTTP_STATUS.BAD_REQUEST);
      }
    }

    await userModel.update(id, { status: 'deleted', updated_by: req.user?.id || null });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User deleted successfully',
    });
  }),
};

