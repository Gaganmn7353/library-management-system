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
    const { search, status } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (status) filters.status = status;

    const { members, total } = await memberModel.findAll({ page, limit, offset, filters });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          members,
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

    res.status(HTTP_STATUS.OK).json(formatSuccess(member, MESSAGES.SUCCESS.RETRIEVED));
  }),

  /**
   * Create a new member
   */
  createMember: asyncHandler(async (req, res) => {
    const { user_id, member_id, phone, address, membership_date, membership_expiry, status = MEMBER_STATUS.ACTIVE } = req.body;

    // Check if user exists
    const user = await userModel.findById(user_id);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if member_id already exists
    const existingMember = await memberModel.findByMemberId(member_id);
    if (existingMember) {
      throw new AppError('Member ID already exists', HTTP_STATUS.CONFLICT);
    }

    // Check if user already has a member profile
    const existingMemberByUserId = await memberModel.findByUserId(user_id);
    if (existingMemberByUserId) {
      throw new AppError('User already has a member profile', HTTP_STATUS.CONFLICT);
    }

    const member = await memberModel.create({
      user_id,
      member_id,
      phone,
      address,
      membership_date,
      membership_expiry,
      status,
    });

    logger.info(`New member created: ${member_id} (User ID: ${user_id})`);

    res.status(HTTP_STATUS.CREATED).json(formatSuccess(member, MESSAGES.SUCCESS.CREATED));
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

    // Validate status if provided
    if (updateData.status && !Object.values(MEMBER_STATUS).includes(updateData.status)) {
      throw new AppError('Invalid member status', HTTP_STATUS.BAD_REQUEST);
    }

    const updatedMember = await memberModel.update(id, updateData);

    logger.info(`Member updated: ${id}`);

    res.status(HTTP_STATUS.OK).json(formatSuccess(updatedMember, MESSAGES.SUCCESS.UPDATED));
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

    res.status(HTTP_STATUS.OK).json(formatSuccess(null, MESSAGES.SUCCESS.DELETED));
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

