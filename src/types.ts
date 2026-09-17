export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface StoryState {
  image: {
    base64: string;
    mimeType: string;
    url: string;
  } | null;
  openingParagraph: string | null;
  history: ChatMessage[];
}
