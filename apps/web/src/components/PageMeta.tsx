import { Helmet } from 'react-helmet-async'

interface PageMetaProps {
  title: string
  description?: string
  ogImage?: string
  canonicalPath?: string
}

export default function PageMeta({ title, description, ogImage, canonicalPath }: PageMetaProps) {
  const fullTitle = `${title} — BibleQuiz`
  const baseUrl = 'https://biblequiz.app'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonicalPath && <link rel="canonical" href={`${baseUrl}${canonicalPath}`} />}
    </Helmet>
  )
}
