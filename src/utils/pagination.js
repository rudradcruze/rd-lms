import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

export const getPaginationParams = (page = 1, limit = 10) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(
        1,
        Math.min(MAX_PAGE_SIZE, parseInt(limit) || DEFAULT_PAGE_SIZE)
    );
    const offset = (pageNum - 1) * limitNum;

    return {
        page: pageNum,
        limit: limitNum,
        offset,
    };
};

export const getPaginationMeta = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};
