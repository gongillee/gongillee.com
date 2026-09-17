export interface Project {
  id: string;
  title: string;
  client: string;
  year: string;
  type: string;
  imageUrl: string;
  description: string;
  mediaType: 'image' | 'video' | 'audio';
  src?: string;
  previewSrc?: string;
  /** Optional grid thumbnail for video/audio works — filename in public/thumbs/ */
  thumbSrc?: string;
}
