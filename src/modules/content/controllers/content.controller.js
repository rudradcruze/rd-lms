import { ApiResponse } from "../../../utils/ApiResponse.js";
import ContentService from "../services/content.service.js";
import { CONTENT_MESSAGES } from "../content.constants.js";

class ContentController {
    // ─── Sections ────────────────────────────────────────────────────────────

    async createSection(req, res) {
        const section = await ContentService.createSection(req.user.userId, req.body);
        return res
            .status(201)
            .json(new ApiResponse(201, section, CONTENT_MESSAGES.SECTION_CREATED));
    }

    async getSectionById(req, res) {
        const section = await ContentService.getSectionById(req.user.userId, req.params.sectionId);
        return res
            .status(200)
            .json(new ApiResponse(200, section, "Section retrieved successfully"));
    }

    async updateSection(req, res) {
        const section = await ContentService.updateSection(req.user.userId, req.params.sectionId, req.body);
        return res
            .status(200)
            .json(new ApiResponse(200, section, CONTENT_MESSAGES.SECTION_UPDATED));
    }

    async deleteSection(req, res) {
        await ContentService.deleteSection(req.user.userId, req.params.sectionId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, CONTENT_MESSAGES.SECTION_DELETED));
    }

    async reorderSection(req, res) {
        const section = await ContentService.reorderSection(req.user.userId, req.params.sectionId, req.body.position);
        return res
            .status(200)
            .json(new ApiResponse(200, section, CONTENT_MESSAGES.SECTION_REORDERED));
    }

    async publishSection(req, res) {
        const isPublished = req.body.isPublished !== false;
        const section = await ContentService.publishSection(req.user.userId, req.params.sectionId, isPublished);
        return res
            .status(200)
            .json(new ApiResponse(200, section, CONTENT_MESSAGES.SECTION_PUBLISHED));
    }

    // ─── Contents ────────────────────────────────────────────────────────────

    async createContent(req, res) {
        const content = await ContentService.createContent(req.user.userId, req.body);
        return res
            .status(201)
            .json(new ApiResponse(201, content, CONTENT_MESSAGES.CONTENT_CREATED));
    }

    async getContentById(req, res) {
        const content = await ContentService.getContentById(req.user.userId, req.params.contentId);
        return res
            .status(200)
            .json(new ApiResponse(200, content, "Content retrieved successfully"));
    }

    async updateContent(req, res) {
        const content = await ContentService.updateContent(req.user.userId, req.params.contentId, req.body);
        return res
            .status(200)
            .json(new ApiResponse(200, content, CONTENT_MESSAGES.CONTENT_UPDATED));
    }

    async deleteContent(req, res) {
        await ContentService.deleteContent(req.user.userId, req.params.contentId);
        return res
            .status(200)
            .json(new ApiResponse(200, null, CONTENT_MESSAGES.CONTENT_DELETED));
    }

    async publishContent(req, res) {
        const isPublished = req.body.isPublished !== false;
        const content = await ContentService.publishContent(req.user.userId, req.params.contentId, isPublished);
        return res
            .status(200)
            .json(new ApiResponse(200, content, CONTENT_MESSAGES.CONTENT_PUBLISHED));
    }

    async reorderContents(req, res) {
        await ContentService.reorderContents(req.user.userId, req.body);
        return res
            .status(200)
            .json(new ApiResponse(200, null, CONTENT_MESSAGES.CONTENT_REORDERED));
    }

    // ─── Uploads ─────────────────────────────────────────────────────────────

    async uploadContent(req, res) {
        const content = await ContentService.createContentWithUpload(
            req.user.userId,
            req.body,
            req.file
        );
        return res
            .status(201)
            .json(new ApiResponse(201, content, CONTENT_MESSAGES.CONTENT_CREATED));
    }
}

export default new ContentController();
