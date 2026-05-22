export const ANNOUNCEMENT_PUBLICATION_STORAGE_KEY = "radar-announcement-publications:v1";

export const announcementPublicationChannels = [
  { id: "feed", label: "Feed aberto", detail: "Post principal publicado." },
  { id: "story", label: "Story", detail: "Versao curta colocada no ar." },
  { id: "video", label: "Video/fala", detail: "Fala direta gravada ou publicada." },
  { id: "team", label: "Equipe alinhada", detail: "Equipe sabe responder com o mesmo contexto." },
] as const;

export type AnnouncementChannelId = (typeof announcementPublicationChannels)[number]["id"];
export type AnnouncementPublicationState = Record<AnnouncementChannelId, boolean>;

export const emptyAnnouncementPublicationState: AnnouncementPublicationState = {
  feed: false,
  story: false,
  video: false,
  team: false,
};

export function readAnnouncementPublicationState(): AnnouncementPublicationState {
  if (typeof window === "undefined") return emptyAnnouncementPublicationState;

  try {
    const stored = JSON.parse(window.localStorage.getItem(ANNOUNCEMENT_PUBLICATION_STORAGE_KEY) ?? "{}") as Partial<AnnouncementPublicationState>;
    return {
      feed: stored.feed === true,
      story: stored.story === true,
      video: stored.video === true,
      team: stored.team === true,
    };
  } catch {
    return emptyAnnouncementPublicationState;
  }
}

export function writeAnnouncementPublicationState(state: AnnouncementPublicationState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANNOUNCEMENT_PUBLICATION_STORAGE_KEY, JSON.stringify(state));
}
