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
}

export interface GridItem extends Project {
  row: number;
  col: number;
  previewUrl?: string;
}
