import { memberModel } from '../models/memberModel.js';
import { userModel } from '../models/userModel.js';
import { HTTP_STATUS, MESSAGES, MEMBER_STATUS } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { formatSuccess } from '../utils/helpers.js';
import { getPaginationParams, formatPagination } from '../utils/helpers.js';
import logger from '../utils/logger.js';

export const memberController = {
  /**
   * Get all members with pagination
   */
  getAllMembers: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req.query);
    // Support both 'q' and 'search' for frontend compatibility
    const search = req.query.q || req.query.search;
    const status = req.query.status;
    const type = req.query.type; // member_type filter

    const filters = {};
    if (search) filters.search = search;
    if (status) filters.status = status;
    if (type) filters.type = type;

    const { members, total } = await memberModel.findAll({ page, limit, offset, filters });

    // Transform members to match frontend expectations
    const transformedMembers = members.map(member => ({
      id: member.id,
      member_id: member.member_id,
      name: member.username || member.name || member.email?.split('@')[0] || 'Unknown',
      email: member.email,
      phone: member.phone || null,
      member_type: member.member_type || 'public',
      registration_date: member.membership_date || member.registration_date,
      status: member.status,
      created_at: member.created_at,
      updated_at: member.updated_at,
    }));

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          members: transformedMembers,
          pagination: formatPagination(page, limit, total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get member by ID
   */
  getMemberById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const member = await memberModel.findById(id);

    if (!member) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Transform member to match frontend expectations
    const transformedMember = {
      id: member.id,
      member_id: member.member_id,
      name: member.username || member.name || member.email?.split('@')[0] || 'Unknown',
      email: member.email,
      phone: member.phone || null,
      member_type: member.member_type || 'public',
      registration_date: member.membership_date || member.registration_date,
      status: member.status,
      created_at: member.created_at,
      updated_at: member.updated_at,
    };

    res.status(HTTP_STATUS.OK).json(formatSuccess({ member: transformedMember }, MESSAGES.SUCCESS.RETRIEVED));
  }),

  /**
   * Create a new member
   * Supports both new format (user_id) and legacy format (name, email, member_id, etc.)
   */
  createMember: asyncHandler(async (req, res) => {
    const { 
      user_id, 
      member_id, 
      name,
      email,
      phone, 
      address, 
      member_type,
      membership_date, 
      membership_expiry, 
      registration_date,
      status = MEMBER_STATUS.ACTIVE 
    } = req.body;

    let userId = user_id;
    let finalMemberId = member_id;

    // Legacy format: frontend sends name, email, member_id directly
    if (!user_id && (name || email || member_id)) {
      // Check if member_id already exists
      if (member_id) {
        const existingMember = await memberModel.findByMemberId(member_id);
        if (existingMember) {
          throw new AppError('Member ID already exists', HTTP_STATUS.CONFLICT);
        }
        finalMemberId = member_id;
      }

      // Check if user with this email already exists
      let user = null;
      if (email) {
        user = await userModel.findByEmail(email);
        if (user) {
          // User exists, check if they already have a member profile
          const existingMember = await memberModel.findByUserId(user.id);
          if (existingMember) {
            throw new AppError('User with this email already has a member profile', HTTP_STATUS.CONFLICT);
          }
          userId = user.id;
        } else {
          // Create new user
          const bcrypt = await import('bcrypt');
          const defaultPassword = await bcrypt.hash('TempPassword123!', 10);
          const username = name?.toLowerCase().replace(/\s+/g, '_') || email.split('@')[0];
          
          user = await userModel.create({
            username,
            email,
            password_hash: defaultPassword,
            role: 'member',
          });
          userId = user.id;
        }
      } else {
        throw new AppError('Email is required', HTTP_STATUS.BAD_REQUEST);
      }
    } else if (user_id) {
      // New format: user_id provided
      const user = await userModel.findById(user_id);
      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check if user already has a member profile
      const existingMemberByUserId = await memberModel.findByUserId(user_id);
      if (existingMemberByUserId) {
        throw new AppError('User already has a member profile', HTTP_STATUS.CONFLICT);
      }

      if (member_id) {
        const existingMember = await memberModel.findByMemberId(member_id);
        if (existingMember) {
          throw new AppError('Member ID already exists', HTTP_STATUS.CONFLICT);
        }
        finalMemberId = member_id;
      }
    } else {
      throw new AppError('Either user_id or (name, email, member_id) must be provided', HTTP_STATUS.BAD_REQUEST);
    }

    // Set default membership dates if not provided
    const memDate = membership_date || registration_date || new Date().toISOString().split('T')[0];
    const memExpiry = membership_expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const member = await memberModel.create({
      user_id: userId,
      member_id: finalMemberId || `MEM${Date.now()}`,
      phone,
      address,
      membership_date: memDate,
      membership_expiry: memExpiry,
      status,
      member_type: member_type || 'regular',
    });

    // Fetch the created member with user details
    const createdMember = await memberModel.findById(member.id);

    logger.info(`New member created: ${finalMemberId} (User ID: ${userId})`);

    // Transform to match frontend expectations
    const transformedMember = {
      id: createdMember.id,
      member_id: createdMember.member_id,
      name: createdMember.username || name || createdMember.email?.split('@')[0] || 'Unknown',
      email: createdMember.email || email,
      phone: createdMember.phone || phone || null,
      member_type: member_type || 'public',
      registration_date: createdMember.membership_date || memDate,
      status: createdMember.status,
      created_at: createdMember.created_at,
      updated_at: createdMember.updated_at,
    };

    res.status(HTTP_STATUS.CREATED).json(formatSuccess(transformedMember, MESSAGES.SUCCESS.CREATED));
  }),

  /**
   * Update member
   */
  updateMember: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if member exists
    const existingMember = await memberModel.findById(id);
    if (!existingMember) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Handle legacy format updates (name, email)
    if (updateData.name || updateData.email) {
      // Update user if email/name changed
      const { userModel } = await import('../models/userModel.js');
      const userUpdate = {};
      if (updateData.email) userUpdate.email = updateData.email;
      if (updateData.name) userUpdate.username = updateData.name.toLowerCase().replace(/\s+/g, '_');
      
      if (Object.keys(userUpdate).length > 0) {
        await userModel.update(existingMember.user_id, userUpdate);
      }
    }

    // Map legacy fields to new schema
    const mappedUpdate = { ...updateData };
    if (updateData.registration_date) {
      mappedUpdate.membership_date = updateData.registration_date;
      delete mappedUpdate.registration_date;
    }

    // Validate status if provided
    if (mappedUpdate.status && !Object.values(MEMBER_STATUS).includes(mappedUpdate.status)) {
      throw new AppError('Invalid member status', HTTP_STATUS.BAD_REQUEST);
    }

    // Remove fields that shouldn't be updated directly
    delete mappedUpdate.name;
    delete mappedUpdate.email;
    delete mappedUpdate.user_id;
    delete mappedUpdate.id;

    const updatedMember = await memberModel.update(id, mappedUpdate);

    // Fetch updated member with user details
    const finalMember = await memberModel.findById(id);

    logger.info(`Member updated: ${id}`);

    // Transform to match frontend expectations
    const transformedMember = {
      id: finalMember.id,
      member_id: finalMember.member_id,
      name: finalMember.username || updateData.name || finalMember.email?.split('@')[0] || 'Unknown',
      email: finalMember.email || updateData.email,
      phone: finalMember.phone || null,
      member_type: updateData.member_type || 'public',
      registration_date: finalMember.membership_date || updateData.registration_date,
      status: finalMember.status,
      created_at: finalMember.created_at,
      updated_at: finalMember.updated_at,
    };

    res.status(HTTP_STATUS.OK).json(formatSuccess(transformedMember, MESSAGES.SUCCESS.UPDATED));
  }),

  /**
   * Delete member (soft delete by setting status to inactive)
   */
  deleteMember: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const member = await memberModel.findById(id);
    if (!member) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if member has active transactions
    const activeTransactions = await memberModel.getActiveTransactions(id);
    if (activeTransactions.length > 0) {
      throw new AppError('Cannot delete member with active transactions. Please return all books first.', HTTP_STATUS.BAD_REQUEST);
    }

    await memberModel.update(id, { status: MEMBER_STATUS.INACTIVE });

    logger.info(`Member deactivated: ${id}`);

    res.status(HTTP_STATUS.OK).json(formatSuccess({ message: 'Member deleted successfully' }, MESSAGES.SUCCESS.DELETED));
  }),

  /**
   * Get member's transaction history
   */
  getMemberTransactions: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit, offset } = getPaginationParams(req.query);

    const member = await memberModel.findById(id);
    if (!member) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const { transactions, total } = await memberModel.getTransactions(id, { page, limit, offset });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          transactions,
          pagination: formatPagination(page, limit, total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get member's reservations
   */
  getMemberReservations: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const member = await memberModel.findById(id);
    if (!member) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const reservations = await memberModel.getReservations(id);

    res.status(HTTP_STATUS.OK).json(formatSuccess(reservations, MESSAGES.SUCCESS.RETRIEVED));
  }),
};

