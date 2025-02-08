import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from "@/lib/cloudinary-config";

export async function POST() {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      upload_preset: cloudinaryConfig.uploadPreset,
    }, cloudinaryConfig.apiSecret!);

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: cloudinaryConfig.cloudName,
      apiKey: cloudinaryConfig.apiKey,
    });
  } catch (error) {
    console.error('[CLOUDINARY_SIGN]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}