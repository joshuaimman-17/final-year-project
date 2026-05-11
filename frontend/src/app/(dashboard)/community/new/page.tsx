"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { communityService } from "@/services";

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content && !previewUrl) return;

    setIsSubmitting(true);
    try {
      await communityService.createPost({
        content: content,
        image_urls: previewUrl ? [previewUrl] : [],
        tags: []
      });
      router.push("/community");
      router.refresh();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to share post. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-2xl p-2">✕</button>
          <h2 className="text-xl font-black text-gray-900">New Post</h2>
        </div>
        <button 
          onClick={handlePost}
          disabled={(!content && !previewUrl) || isSubmitting}
          className={`px-6 py-2 rounded-xl font-black text-sm transition-all ${
            content || previewUrl ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-400'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? "Sharing..." : "Share"}
        </button>
      </div>

      <div className="flex items-start space-x-4 px-1">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl shadow-inner flex-shrink-0">🚜</div>
        <div className="flex-1 space-y-4">
          <textarea 
            placeholder="What's happening in your fields?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent border-none py-2 outline-none text-lg font-medium text-gray-800 placeholder-gray-300 resize-none min-h-[120px]"
          ></textarea>

          {previewUrl && (
            <div className="relative rounded-3xl overflow-hidden border-2 border-green-50 shadow-sm max-h-[300px]">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setImage(null); setPreviewUrl(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70 transition-all"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 px-1">
         <div className="flex items-center space-x-4 text-2xl">
           <input 
             type="file" 
             accept="image/*" 
             ref={fileInputRef} 
             onChange={handleImageChange} 
             className="hidden" 
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className={`bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${previewUrl ? 'text-green-600 bg-green-50' : 'grayscale hover:grayscale-0'}`}
           >
             📸
           </button>
           <button className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center grayscale hover:grayscale-0 transition-all">📍</button>
           <button className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center grayscale hover:grayscale-0 transition-all">🏷️</button>
         </div>

         <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100">
            <div className="flex items-center space-x-3 mb-2">
               <span className="text-xl">💡</span>
               <h4 className="font-bold text-green-900">Expert Tip</h4>
            </div>
            <p className="text-sm text-green-800 font-medium leading-relaxed">
              Tag your crops to reach more farmers in your region. Posts with photos get 3x more engagement!
            </p>
         </div>
      </div>
    </div>
  );
}
