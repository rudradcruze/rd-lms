class ApiResponse {
    constructor(
        statusCode,
        data = null,
        message = "Data fetched successfully."
    ) {
        this.statusCode = statusCode < 400;
        this.data = data;
        this.message = message;
        this.success = true;
    }
}
