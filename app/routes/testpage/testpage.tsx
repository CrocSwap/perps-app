import ScaleOrders from '~/components/Trade/OrderInput/ScaleOrders/ScaleOrders';
import styles from './testpage.module.css';

interface propsIF {}

// main react fn
export default function testpage(props: propsIF) {
    false && props;

    return (
        <>
            <title>My Page Title</title>
            <meta name='description' content='My Page Description' />
            <meta
                name='viewport'
                content='width=device-width, initial-scale=1.0'
            />
            <meta name='keywords' content='keyword1, keyword2, keyword3' />
            <meta name='author' content='Your Name' />
            <meta name='robots' content='index, follow' />
            <meta name='theme-color' content='#000000' />
            <meta property='og:type' content='website' />
            <meta property='og:url' content='https://www.example.com' />
            <meta
                property='og:image'
                content='https://res.cloudinary.com/demo/image/upload/l_text:Arial_50_bold:BTC%20USDC,co_rgb:FFFFFF,c_fit,w_1000,h_500/v1/background.jpg'
            />
            <meta property='og:description' content='My Page Description' />
            <meta property='og:site_name' content='My Site Name' />
            <meta property='og:locale' content='en_US' />
            <meta property='og:locale:alternate' content='es_ES' />
            <meta property='og:image:width' content='1200' />
            <meta property='og:image:height' content='630' />
            <meta property='og:image:type' content='image/jpeg' />
            <meta property='og:title' content='My Page Title' />
            <div className={styles.testpage}>
                <div style={{ width: '400px' }}>
                    <ScaleOrders
                        totalQuantity={parseFloat('0.2233')}
                        minPrice={parseFloat('242423')}
                        maxPrice={parseFloat('99993321')}
                        // isModal
                        onClose={() => console.log('close modal')}
                    />
                </div>
            </div>
        </>
    );
}
