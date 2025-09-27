import axios from "axios"
import { defineEventHandler, getQuery } from "h3"

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery<{ url?: string }>(event)

    // Check if URL parameter is provided
    if (!query.url) {
      return {
        error: "URL parameter is required",
        data: null,
      }
    }

    const url = query.url

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return {
        error: "Invalid URL format",
        data: null,
      }
    }

    // Simple fallback metadata
    let metadata: {
      url: string
      title: string | null
      description: string | null
      image: { url: string | null }
    } = {
      url,
      title: null,
      description: "Link preview service is temporarily unavailable",
      image: { url: null },
    }

    // Try to fetch metadata
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
        },
      })

      const html: string = response.data

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch) {
        metadata.title = titleMatch[1].trim()
      } else {
        const ogTitleMatch = html.match(
          /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
        )
        if (ogTitleMatch) {
          metadata.title = ogTitleMatch[1].trim()
        } else {
          // find the first h1 in the HTML
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
          if (h1Match) {
            metadata.title = h1Match[1].trim()
          }
        }
      }

      // Extract description
      const descMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
      )
      if (descMatch) {
        metadata.description = descMatch[1].trim()
      } else {
        const ogDescMatch = html.match(
          /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
        )
        if (ogDescMatch) {
          metadata.description = ogDescMatch[1].trim()
        } else {
          metadata.description = null
        }
      }

      // Extract og:image
      const imageMatch = html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      )
      if (imageMatch) {
        metadata.image.url = imageMatch[1].trim()
      } else {
        // find the first image in the HTML
        const imageRegex = /<img[^>]*src=["']([^"']+)["']/gi
        const imageMatches = html.match(imageRegex)
        if (imageMatches) {
          metadata.image.url = imageMatches[0].trim()
        } else {
          const titleWithoutSpaces = metadata.title?.replace(/\s+/g, '+')
          metadata.image.url = "https://placehold.co/600x400/8e85e6/FFF?text=" + titleWithoutSpaces
        }
      }
    } catch (fetchError: any) {
      console.error("Error fetching URL:", fetchError.message)
      // Keep fallback metadata
    }

    return { data: metadata }
  } catch (error: any) {
    console.error("Link preview API error:", error)
    return {
      error: "Internal server error",
      data: null,
    }
  }
})
