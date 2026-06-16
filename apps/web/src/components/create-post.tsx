"use client";
import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function CreatePost() {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const createPostMutation = useMutation({
    mutationFn: async ({ text, selectedFile }: { text: string; selectedFile: File | null }) => {
      let imageUrl = undefined;
      
      if (selectedFile) {
        setIsUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        imageUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Bypass Next.js proxy for large video uploads by hitting the backend port directly
          const backendUrl = typeof window !== 'undefined' 
            ? `${window.location.protocol}//${window.location.hostname}:4000/api/v1/media/upload`
            : '/api/v1/media/upload';
            
          xhr.open('POST', backendUrl);
          xhr.withCredentials = true;
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          
          xhr.onload = () => {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const res = JSON.parse(xhr.responseText);
                resolve(res.url);
              } catch (err) {
                reject(new Error('Invalid response from server'));
              }
            } else {
              try {
                const res = JSON.parse(xhr.responseText);
                reject(new Error(res.message || `Upload failed with status ${xhr.status}`));
              } catch (err) {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          };
          
          xhr.onerror = () => {
            setIsUploading(false);
            reject(new Error('Network error during upload'));
          };
          
          xhr.send(formData);
        });
      }

      const res = await api.post('/posts', { caption: text, imageUrl });
      return res.data;
    },
    onSuccess: () => {
      setCaption('');
      setFile(null);
      setPreview(null);
      setUploadProgress(0);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Posted successfully! 🎉');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to post');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !file) return;
    createPostMutation.mutate({ text: caption, selectedFile: file });
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white mb-6 sm:mb-8 animate-fade-in-up">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-brand-light to-brand/20 rounded-full flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand sm:w-5 sm:h-5 w-4 h-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="flex-1">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-transparent resize-none text-ink placeholder:text-ink/40 focus:outline-none text-base sm:text-lg min-h-[60px]"
              rows={2}
            />
            
            {preview && (
              <div className="relative mt-3 rounded-2xl overflow-hidden bg-shell/50 shadow-inner border border-line/50">
                {file?.type.startsWith('video/') ? (
                  <video src={preview} controls className="w-full max-h-[400px] bg-black" />
                ) : (
                  <img src={preview} alt="Upload preview" className="w-full max-h-[400px] object-cover" />
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-xs bg-white/20 rounded-full h-2 mb-2 overflow-hidden">
                      <div className="bg-brand h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <div className="text-white font-bold text-lg">{uploadProgress}% Uploaded</div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={clearFile}
                  disabled={isUploading}
                  className="absolute top-3 right-3 bg-ink/50 backdrop-blur-md text-white rounded-full p-2 hover:bg-ink/70 hover:scale-110 transition-all shadow-lg"
                  aria-label="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-line/50 flex items-center justify-between">
          <label className="cursor-pointer text-brand hover:bg-brand/10 p-2 sm:p-2.5 rounded-full transition-all hover:scale-105 flex items-center gap-1.5 sm:gap-2 group">
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={handleFileChange} 
              ref={fileInputRef}
              disabled={createPostMutation.isPending}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-brand-hover transition-colors sm:w-[22px] sm:h-[22px] w-5 h-5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span className="text-sm font-semibold group-hover:text-brand-hover transition-colors">Media</span>
          </label>
          <button
            type="submit"
            disabled={createPostMutation.isPending || (!caption.trim() && !file) || isUploading}
            className="bg-brand text-white px-6 sm:px-8 py-2 sm:py-2.5 text-sm sm:text-base rounded-full font-semibold hover:bg-brand-hover shadow-md shadow-brand/20 hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md flex items-center gap-2"
          >
            {createPostMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {isUploading ? 'Uploading...' : 'Posting...'}
              </>
            ) : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
