import { ApiResponse } from "../../../utils/ApiResponse.js";
import { AUTH_MESSAGES } from "../auth.constants.js";
import AuthService from "../services/auth.service.js";

class AuthController {
    async register(req, res) {
        const result = await AuthService.register(req.body);

        return res
            .status(201)
            .json(
                new ApiResponse(201, result, AUTH_MESSAGES.REGISTRATION_SUCCESS)
            );
    }

    async login(req, res) {
        const { identifier, password } = req.body;
        const result = await AuthService.login(identifier, password);

        return res
            .status(200)
            .json(new ApiResponse(200, result, AUTH_MESSAGES.LOGIN_SUCCESS));
    }

    async refreshToken(req, res) {
        const { refreshToken } = req.body;
        const result = await AuthService.refreshToken(refreshToken);

        return res
            .status(200)
            .json(new ApiResponse(200, result, AUTH_MESSAGES.REFRESH_SUCCESS));
    }

    async logout(req, res) {
        const { refreshToken } = req.body;
        await AuthService.logout(req.user.userId, refreshToken);

        return res
            .status(200)
            .json(new ApiResponse(200, null, AUTH_MESSAGES.LOGOUT_SUCCESS));
    }

    async changePassword(req, res) {
        const { oldPassword, newPassword } = req.body;
        await AuthService.changePassword(
            req.user.userId,
            oldPassword,
            newPassword
        );

        return res
            .status(200)
            .json(new ApiResponse(200, null, AUTH_MESSAGES.PASSWORD_CHANGED));
    }
}

export default new AuthController();
