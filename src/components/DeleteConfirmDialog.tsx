"use client";

import React from "react";
import { Button } from "./ui/button";
import { Trash2, X } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chatName: string;
  isDeleting: boolean;
}

const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  chatName,
  isDeleting,
}: DeleteConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Delete Chat</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Are you sure you want to delete this chat and document?
          </p>
          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
            <strong>Document:</strong> {chatName}
          </p>
          <p className="text-sm text-red-600 mt-2">
            This action cannot be undone. All messages and the document will be permanently deleted.
          </p>
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;
