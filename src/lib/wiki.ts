// Fetches animal images from the Steal a Brainrot Fandom wiki.
// Uses the MediaWiki API to resolve the image URL for a given article title.

const WIKI_API = 'https://stealabrainrot.fandom.com/api.php'

const imageCache: Record<string, string> = {}

export async function getWikiImageUrl(animalName: string): Promise<string | null> {
  if (imageCache[animalName]) return imageCache[animalName]

  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: animalName,
      prop: 'pageimages',
      pithumbsize: '300',
      format: 'json',
      origin: '*',
    })

    const res = await fetch(`${WIKI_API}?${params}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null

    const data = await res.json()
    const pages = data?.query?.pages ?? {}
    const page = Object.values(pages)[0] as { thumbnail?: { source: string } }
    const url = page?.thumbnail?.source ?? null

    if (url) imageCache[animalName] = url
    return url
  } catch {
    return null
  }
}
