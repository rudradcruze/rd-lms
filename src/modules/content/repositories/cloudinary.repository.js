import cloudinary from "../../../configurations/cloudinary.js";

class CloudinaryRepository {
    async uploadFromBuffer(fileBuffer, mimeType, folder = "lms_content") {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: "auto",
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                }
            );
            uploadStream.end(fileBuffer);
        });
    }
}

export default new CloudinaryRepository();
