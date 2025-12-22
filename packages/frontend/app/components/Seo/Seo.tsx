import { Helmet } from 'react-helmet-async';

type SeoProps = {
    title: string;
    description: string;
    canonicalUrl: string;
    ogImageUrl?: string;
    ogImageAlt?: string;
};

export default function Seo({
    title,
    description,
    canonicalUrl,
    ogImageUrl,
    ogImageAlt,
}: SeoProps) {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name='description' content={description} />
            <link rel='canonical' href={canonicalUrl} />

            <meta property='og:type' content='website' />
            <meta property='og:site_name' content='Ambient Perps' />
            <meta property='og:title' content={title} />
            <meta property='og:description' content={description} />
            <meta property='og:url' content={canonicalUrl} />
            {ogImageUrl ? (
                <meta property='og:image' content={ogImageUrl} />
            ) : null}
            {ogImageAlt ? (
                <meta property='og:image:alt' content={ogImageAlt} />
            ) : null}

            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:site' content='@ambient_finance' />
            <meta name='twitter:title' content={title} />
            <meta name='twitter:description' content={description} />
            {ogImageUrl ? (
                <meta name='twitter:image' content={ogImageUrl} />
            ) : null}
            {ogImageAlt ? (
                <meta name='twitter:image:alt' content={ogImageAlt} />
            ) : null}
        </Helmet>
    );
}
