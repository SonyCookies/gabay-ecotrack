import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GABAY EcoTrack',
    short_name: 'GABAY',
    description: 'Centralized solid waste management logistics platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1b4018',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
