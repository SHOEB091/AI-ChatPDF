"use client";
import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

// https://github.com/aws/aws-sdk-js-v3/issues/4126

const FileUpload = () => {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  interface CreateChatResponse {
    chat_id: number;
  }

  interface CreateChatInput {
    file_key: string;
    file_name: string;
  }

  const mutation = useMutation({
    mutationFn: async (input: CreateChatInput) => {
      try {
        console.log('Sending request to create chat:', input);
        const response = await axios.post<CreateChatResponse>("/api/create-chat", input);
        console.log('Create chat response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('Error in create chat mutation:', error?.response?.data || error);
        throw error;
      }
    },
  });

  const { mutate } = mutation;
  const isLoading = mutation.isPending;

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        // bigger than 10mb!
        toast.error("File too large");
        return;
      }

      try {
        setUploading(true);
        console.log("Starting file upload...");
        const data = await uploadToS3(file);
        console.log("S3 upload response:", data);
        
        if (!data?.file_key || !data.file_name) {
          console.error("Invalid S3 upload response:", data);
          toast.error("Something went wrong with file upload");
          return;
        }
        
        console.log("Creating chat with file:", { file_key: data.file_key, file_name: data.file_name });
        mutate(data, {
          onSuccess: ({ chat_id }) => {
            console.log("Chat created successfully:", chat_id);
            toast.success("Chat created!");
            router.push(`/chat/${chat_id}`);
          },
          onError: (err: any) => {
            console.error("Failed to create chat:", err?.response?.data || err);
            toast.error(err?.response?.data?.error || "Error creating chat");
          },
        });
      } catch (error: any) {
        console.error("File upload failed:", error?.message || error);
        toast.error(error?.message || "Failed to upload file");
      } finally {
        setUploading(false);
      }
    },
  });
  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {uploading || isLoading ? (
          <>
            {/* loading state */}
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-slate-400">
              Spilling Tea to GPT...
            </p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
