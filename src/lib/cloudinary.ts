import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export interface UploadResult {
  url: string
  publicId: string
  format: string
  width?: number
  height?: number
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'travereel'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }
        
        if (!result) {
          reject(new Error('Upload failed'))
          return
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        })
      }
    )

    uploadStream.end(fileBuffer)
  })
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}
