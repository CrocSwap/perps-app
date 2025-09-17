import { useState } from 'react';
import styles from './tabShowcase.module.css';
import Tabs from '~/components/Tabs/Tabs';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { motion } from 'framer-motion';

export default function TabsShowcase() {
    const [showCode, setShowCode] = useState<any>({});
    const [activeBasicTab, setActiveBasicTab] = useState('tab1');
    const [activeObjectTab, setActiveObjectTab] = useState('home');
    const [activeRightContentTab, setActiveRightContentTab] = useState('all');
    const [filterOption, setFilterOption] = useState('all');

    const basicTabs = ['Overview', 'Analytics', 'Settings', 'Help'];

    const dynamicTabs = [
        'Overview',
        'Positions (5)',
        'Orders (12)',
        'History',
        'Analytics',
        'Settings',
        'Reports',
        'Notifications',
        'Help & Support',
    ];

    const objectTabs = [
        { id: 'home', label: 'Home' },
        { id: 'about', label: 'About Us' },
        { id: 'services', label: 'Services' },
        { id: 'portfolio', label: 'Portfolio' },
        { id: 'contact', label: 'Contact' },
    ];

    const toggleCode = (section: any) => {
        setShowCode((prev: any) => ({ ...prev, [section]: !prev[section] }));
    };

    const CodeBlock = ({ children, title }: any) => (
        <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
                <span>{title}</span>
                <button
                    className={styles.copyBtn}
                    onClick={() => navigator.clipboard.writeText(children)}
                >
                    Copy
                </button>
            </div>
            <pre className={styles.codeContent}>
                <code>{children}</code>
            </pre>
        </div>
    );

    const FilterDropdown = ({ value, onChange }: any) => (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                background: 'var(--bg-dark4)',
                color: 'var(--text1, #f0f0f8)',
                border: '1px solid var(--bg-dark5)',
                borderRadius: 'var(--radius-s)',
                padding: 'var(--padding-xs) var(--padding-s)',
                fontSize: 'var(--font-size-s)',
            }}
        >
            <option value='all'>All Items</option>
            <option value='active'>Active Only</option>
            <option value='pending'>Pending</option>
        </select>
    );

    return (
        <div className={styles.showcase}>
            <div className={styles.showcaseHeader}>
                <h1>Tabs Component Showcase</h1>
                <p>
                    A comprehensive guide to using the Tabs component with
                    Framer Motion animations, scrollable navigation, and
                    flexible content management.
                </p>
            </div>

            {/* Basic Usage */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Basic Usage</h2>
                        <p>
                            Simple tabs with string array and default behavior
                        </p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('basic')}
                    >
                        {showCode.basic ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.tabDemo}>
                    <Tabs
                        tabs={basicTabs}
                        defaultTab='Overview'
                        onTabChange={setActiveBasicTab}
                        layoutIdPrefix='basic'
                    />
                    <div className={styles.tabContent}>
                        <motion.div
                            key={activeBasicTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h3>Content for {activeBasicTab}</h3>
                            <p>
                                This content changes based on the selected tab
                                with smooth animations.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {showCode.basic && (
                    <CodeBlock title='Basic Usage'>
                        {`import Tabs from '~/components/Tabs/Tabs';

const tabs = ['Overview', 'Analytics', 'Settings', 'Help'];
const [activeTab, setActiveTab] = useState('Overview');

<Tabs
    tabs={tabs}
    defaultTab="Overview"
    onTabChange={setActiveTab}
    layoutIdPrefix="basic"
/>

// Display content based on active tab
<div>
    <h3>Content for {activeTab}</h3>
    <p>This content changes based on the selected tab.</p>
</div>`}
                    </CodeBlock>
                )}
            </section>

            {/* Object-Based Tabs */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Object-Based Tabs</h2>
                        <p>
                            Using objects with separate IDs and labels for more
                            control
                        </p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('objects')}
                    >
                        {showCode.objects ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.tabDemo}>
                    <Tabs
                        tabs={objectTabs}
                        defaultTab='home'
                        onTabChange={setActiveObjectTab}
                        layoutIdPrefix='object'
                    />
                    <div className={styles.tabContent}>
                        <motion.div
                            key={activeObjectTab}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h3>
                                Page:{' '}
                                {
                                    objectTabs.find(
                                        (tab) => tab.id === activeObjectTab,
                                    )?.label
                                }
                            </h3>
                            <p>
                                Object-based tabs allow you to have different
                                IDs and display labels.
                            </p>
                            <p>
                                Current tab ID: <code>{activeObjectTab}</code>
                            </p>
                        </motion.div>
                    </div>
                </div>

                {showCode.objects && (
                    <CodeBlock title='Object-Based Tabs'>
                        {`const objectTabs = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'services', label: 'Services' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'contact', label: 'Contact' }
];

<Tabs
    tabs={objectTabs}
    defaultTab="home"
    onTabChange={setActiveTab}
    layoutIdPrefix="object"
/>`}
                    </CodeBlock>
                )}
            </section>

            {/* Right Content */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Right Content Area</h2>
                        <p>
                            Adding controls, filters, or actions to the right
                            side of tabs
                        </p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('rightContent')}
                    >
                        {showCode.rightContent ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.tabDemo}>
                    <Tabs
                        tabs={['All Items', 'Active', 'Pending', 'Completed']}
                        defaultTab='All Items'
                        onTabChange={setActiveRightContentTab}
                        layoutIdPrefix='rightContent'
                        rightContent={
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 'var(--gap-s)',
                                    alignItems: 'center',
                                }}
                            >
                                <FilterDropdown
                                    value={filterOption}
                                    onChange={setFilterOption}
                                />
                                <SimpleButton
                                    bg='accent1'
                                    style={{
                                        padding: '4px 12px',
                                        fontSize: '12px',
                                    }}
                                >
                                    Export
                                </SimpleButton>
                            </div>
                        }
                    />
                    <div className={styles.tabContent}>
                        <motion.div
                            key={`${activeRightContentTab}-${filterOption}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h3>{activeRightContentTab}</h3>
                            <p>
                                Current filter: <strong>{filterOption}</strong>
                            </p>
                            <p>
                                The right content area is perfect for filters,
                                actions, or additional controls.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {showCode.rightContent && (
                    <CodeBlock title='Right Content Area'>
                        {`const rightContent = (
    <div style={{ display: 'flex', gap: 'var(--gap-s)' }}>
        <FilterDropdown 
            value={filterOption} 
            onChange={setFilterOption} 
        />
        <SimpleButton bg="accent1">Export</SimpleButton>
    </div>
);

<Tabs
    tabs={['All Items', 'Active', 'Pending', 'Completed']}
    defaultTab="All Items"
    onTabChange={setActiveTab}
    rightContent={rightContent}
    layoutIdPrefix="rightContent"
/>`}
                    </CodeBlock>
                )}
            </section>

            {/* Dynamic Content */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Dynamic Tab Labels</h2>
                        <p>
                            Tab labels that update based on data (like counts or
                            status)
                        </p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('dynamic')}
                    >
                        {showCode.dynamic ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.tabDemo}>
                    <Tabs
                        tabs={dynamicTabs}
                        defaultTab='Overview'
                        layoutIdPrefix='dynamic'
                    />
                    <div className={styles.tabContent}>
                        <h3>Dynamic Labels Demo</h3>
                        <p>
                            In real applications, these counts would update
                            based on your actual data:
                        </p>
                        <ul>
                            <li>
                                <strong>Positions (5)</strong> - Number of open
                                positions
                            </li>
                            <li>
                                <strong>Orders (12)</strong> - Number of pending
                                orders
                            </li>
                        </ul>
                        <p>
                            The tabs component automatically handles these
                            dynamic labels.
                        </p>
                    </div>
                </div>

                {showCode.dynamic && (
                    <CodeBlock title='Dynamic Tab Labels'>
                        {`// Your component receives dynamic data
const { positions, orders } = useTradeData();

// Create tabs with dynamic counts
const dynamicTabs = [
    'Overview',
    \`Positions (\${positions.length})\`,
    \`Orders (\${orders.length})\`,
    'History'
];

<Tabs
    tabs={dynamicTabs}
    defaultTab="Overview"
    layoutIdPrefix="dynamic"
/>

// The Tabs component also handles this automatically for common labels:
// - 'Balances' -> 'Balances (5)' when data is available
// - 'Positions' -> 'Positions (3)' when data is available
// - 'Open Orders' -> 'Open Orders (7)' when data is available
// - 'TWAP' -> 'TWAP (2)' when data is available`}
                    </CodeBlock>
                )}
            </section>

            {/* Props Documentation */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Props Documentation</h2>
                        <p>Complete reference for all available props</p>
                    </div>
                </div>

                <div className={styles.propsTable}>
                    <div className={styles.propsHeader}>
                        <span>Prop</span>
                        <span>Type</span>
                        <span>Default</span>
                        <span>Description</span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>tabs</code>
                        <span>
                            Array&lt;string | {'{id: string, label: string}'}
                            &gt;
                        </span>
                        <code>required</code>
                        <span>
                            Array of tab items, either strings or objects with
                            id and label
                        </span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>defaultTab</code>
                        <span>string</span>
                        <code>first tab</code>
                        <span>
                            Initial active tab (uses tab ID for objects, string
                            value for strings)
                        </span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>onTabChange</code>
                        <span>(tab: string) =&gt; void</span>
                        <code>undefined</code>
                        <span>Callback function called when tab changes</span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>rightContent</code>
                        <span>ReactNode</span>
                        <code>undefined</code>
                        <span>
                            Content to display on the right side of the tabs
                        </span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>wrapperId</code>
                        <span>string</span>
                        <code>undefined</code>
                        <span>ID attribute for the tabs container element</span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>layoutIdPrefix</code>
                        <span>string</span>
                        <code>'tabIndicator'</code>
                        <span>
                            Prefix for Framer Motion layoutId to avoid conflicts
                        </span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>wide</code>
                        <span>boolean</span>
                        <code>false</code>
                        <span>Apply wider padding to tabs</span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>flex</code>
                        <span>boolean</span>
                        <code>false</code>
                        <span>
                            Make tabs flex to fill available width equally
                        </span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>staticHeight</code>
                        <span>string</span>
                        <code>'auto'</code>
                        <span>Fixed height for the tabs container</span>
                    </div>
                </div>
            </section>

            {/* Usage Examples */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Common Usage Patterns</h2>
                        <p>Real-world examples and implementation patterns</p>
                    </div>
                </div>

                <div className={styles.usageExamples}>
                    <div className={styles.exampleGroup}>
                        <h3>Navigation Tabs</h3>
                        <code className={styles.exampleCode}>
                            const navigationTabs = ['Dashboard', 'Analytics',
                            'Settings'];
                            <br />
                            <br />
                            &lt;Tabs
                            <br />
                            &nbsp;&nbsp;tabs={'{navigationTabs}'}
                            <br />
                            &nbsp;&nbsp;defaultTab="Dashboard"
                            <br />
                            &nbsp;&nbsp;onTabChange=
                            {'{(tab) => navigate(`/${tab.toLowerCase()}`)}'}
                            <br />
                            &nbsp;&nbsp;layoutIdPrefix="nav"
                            <br />
                            /&gt;
                        </code>
                    </div>

                    <div className={styles.exampleGroup}>
                        <h3>Data Tables with Filters</h3>
                        <code className={styles.exampleCode}>
                            &lt;Tabs
                            <br />
                            &nbsp;&nbsp;tabs=
                            {
                                '{[`Positions (${positions.length})`, `Orders (${orders.length})`]}'
                            }
                            <br />
                            &nbsp;&nbsp;defaultTab="Positions"
                            <br />
                            &nbsp;&nbsp;onTabChange={'{setActiveTable}'}
                            <br />
                            &nbsp;&nbsp;rightContent={'{<FilterControls />}'}
                            <br />
                            &nbsp;&nbsp;layoutIdPrefix="dataTable"
                            <br />
                            /&gt;
                        </code>
                    </div>

                    <div className={styles.exampleGroup}>
                        <h3>Settings Panels</h3>
                        <code className={styles.exampleCode}>
                            &lt;Tabs
                            <br />
                            &nbsp;&nbsp;tabs=
                            {
                                '{[{id: "general", label: "General"}, {id: "security", label: "Security"}]}'
                            }
                            <br />
                            &nbsp;&nbsp;defaultTab="general"
                            <br />
                            &nbsp;&nbsp;onTabChange={'{setActiveSettings}'}
                            <br />
                            &nbsp;&nbsp;wide={'{true}'}
                            <br />
                            &nbsp;&nbsp;layoutIdPrefix="settings"
                            <br />
                            /&gt;
                        </code>
                    </div>
                </div>
            </section>
        </div>
    );
}
