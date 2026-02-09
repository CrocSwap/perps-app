import { useState } from 'react';
import styles from './modalShowcase.module.css';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useModal } from '~/hooks/useModal';

export default function ModalShowcase() {
    const [showCode, setShowCode] = useState<any>({});

    // Modal controls for different examples
    const basicModal = useModal();
    const centerModal = useModal();
    const bottomRightModal = useModal();
    const bottomSheetModal = useModal();
    const forceBottomSheetModal = useModal();
    const autoOpenModal = useModal();
    const longContentModal = useModal();
    const formModal = useModal();
    const nestedModal = useModal();
    const innerNestedModal = useModal();

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

    return (
        <div className={styles.showcase}>
            <div className={styles.showcaseHeader}>
                <h1>Modal Component Showcase</h1>
                <p>
                    A comprehensive guide to using the Modal component with all
                    its positions, features, and the useModal hook for state
                    management.
                </p>
            </div>

            {/* Basic Usage */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Basic Usage</h2>
                        <p>Simple modal with default center position</p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('basic')}
                    >
                        {showCode.basic ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.buttonGrid}>
                    <div className={styles.buttonDemo}>
                        <SimpleButton onClick={basicModal.open}>
                            Open Basic Modal
                        </SimpleButton>
                        <span className={styles.buttonLabel}>
                            Default modal behavior
                        </span>
                    </div>
                </div>

                {showCode.basic && (
                    <CodeBlock title='Basic Usage'>
                        {`import Modal from '~/components/Modal/Modal';
import { useModal } from '~/hooks/useModal';

function MyComponent() {
    const modalCtrl = useModal();
    
    return (
        <>
            <button onClick={modalCtrl.open}>Open Modal</button>
            {modalCtrl.isOpen && (
                <Modal close={modalCtrl.close} title="My Modal">
                    <p>Modal content goes here</p>
                </Modal>
            )}
        </>
    );
}`}
                    </CodeBlock>
                )}
            </section>

            {/* Modal Positions */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Modal Positions</h2>
                        <p>
                            Different positioning options for various use cases
                        </p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('positions')}
                    >
                        {showCode.positions ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.buttonGrid}>
                    <div className={styles.buttonDemo}>
                        <SimpleButton onClick={centerModal.open}>
                            Center Modal
                        </SimpleButton>
                        <span className={styles.buttonLabel}>
                            position="center" (default)
                        </span>
                    </div>
                    <div className={styles.buttonDemo}>
                        <SimpleButton
                            bg='accent2'
                            onClick={bottomRightModal.open}
                        >
                            Bottom Right Modal
                        </SimpleButton>
                        <span className={styles.buttonLabel}>
                            position="bottomRight"
                        </span>
                    </div>
                    <div className={styles.buttonDemo}>
                        <SimpleButton
                            bg='accent3'
                            onClick={bottomSheetModal.open}
                        >
                            Bottom Sheet Modal
                        </SimpleButton>
                        <span className={styles.buttonLabel}>
                            position="bottomSheet"
                        </span>
                    </div>
                </div>

                {showCode.positions && (
                    <CodeBlock title='Modal Positions'>
                        {`// Center position (default)
<Modal close={modalCtrl.close} title="Center Modal">
    Content here
</Modal>

// Bottom right position
<Modal 
    close={modalCtrl.close} 
    position="bottomRight" 
    title="Bottom Right Modal"
>
    Content here
</Modal>

// Bottom sheet position
<Modal 
    close={modalCtrl.close} 
    position="bottomSheet" 
    title="Bottom Sheet Modal"
>
    Content here
</Modal>`}
                    </CodeBlock>
                )}
            </section>

            {/* Mobile Behavior */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Mobile Behavior</h2>
                        <p>Responsive behavior and mobile-specific features</p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('mobile')}
                    >
                        {showCode.mobile ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.buttonGrid}>
                    <div className={styles.buttonDemo}>
                        <SimpleButton
                            bg='accent4'
                            onClick={forceBottomSheetModal.open}
                        >
                            Force Bottom Sheet
                        </SimpleButton>
                        <span className={styles.buttonLabel}>
                            forceBottomSheet={'{true}'}
                        </span>
                    </div>
                </div>

                {showCode.mobile && (
                    <CodeBlock title='Mobile Behavior'>
                        {`// Force bottom sheet on all devices
<Modal 
    close={modalCtrl.close}
    forceBottomSheet={true}
    title="Always Bottom Sheet"
>
    This will be a bottom sheet on desktop too
</Modal>

// Custom mobile breakpoint
<Modal 
    close={modalCtrl.close}
    mobileBreakpoint={1024}
    title="Custom Breakpoint"
>
    Bottom sheet below 1024px width
</Modal>`}
                    </CodeBlock>
                )}
            </section>

            {/* useModal Hook States */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>useModal Hook States</h2>
                        <p>
                            Different initialization states for the useModal
                            hook
                        </p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('hookStates')}
                    >
                        {showCode.hookStates ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.buttonGrid}>
                    <div className={styles.buttonDemo}>
                        <SimpleButton bg='green' onClick={autoOpenModal.open}>
                            Manual Open
                        </SimpleButton>
                        <span className={styles.buttonLabel}>useModal()</span>
                    </div>
                </div>

                {showCode.hookStates && (
                    <CodeBlock title='useModal Hook States'>
                        {`import { useModal } from '~/hooks/useModal';

// Default closed state
const modalCtrl = useModal();

// Auto-open on component mount
const autoModal = useModal({ defaultState: 'open' });

// Auto-open after delay (milliseconds)
const delayedModal = useModal({ defaultState: 2000 });

// Hook interface
interface useModalIF {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}`}
                    </CodeBlock>
                )}
            </section>

            {/* Special Features */}
            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>Special Features</h2>
                        <p>Advanced modal features and behaviors</p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('features')}
                    >
                        {showCode.features ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.buttonGrid}>
                    <div className={styles.buttonDemo}>
                        <SimpleButton
                            bg='accent5'
                            onClick={longContentModal.open}
                        >
                            Long Content Modal
                        </SimpleButton>
                        <span className={styles.buttonLabel}>
                            Scrollable content
                        </span>
                    </div>
                    <div className={styles.buttonDemo}>
                        <SimpleButton bg='red' onClick={formModal.open}>
                            Form Modal
                        </SimpleButton>
                        <span className={styles.buttonLabel}>
                            Keyboard handling
                        </span>
                    </div>
                    <div className={styles.buttonDemo}>
                        <SimpleButton bg='dark5' onClick={nestedModal.open}>
                            Nested Modals
                        </SimpleButton>
                        <span className={styles.buttonLabel}>
                            Multiple modals
                        </span>
                    </div>
                </div>

                {showCode.features && (
                    <CodeBlock title='Special Features'>
                        {`// For long content modals, just make the main container of your content scrollable.
<Modal title="No Close">
<div style={{overflowY: 'scroll', height: '400px'}}>
    {children}
    </div>
</Modal>

// Modal with form inputs (keyboard handling)
<Modal close={modalCtrl.close} title="Form Modal">
    <input type="text" placeholder="Auto-focuses on mobile" />
    <textarea placeholder="Keyboard detection"></textarea>
</Modal>

// Nested modals
const outerModal = useModal();
const innerModal = useModal();

{outerModal.isOpen && (
    <Modal close={outerModal.close} title="Outer Modal">
        <button onClick={innerModal.open}>Open Inner Modal</button>
        {innerModal.isOpen && (
            <Modal close={innerModal.close} title="Inner Modal">
                Nested content
            </Modal>
        )}
    </Modal>
)}`}
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
                        <code>title</code>
                        <span>string</span>
                        <code>required</code>
                        <span>Modal title displayed in header</span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>close</code>
                        <span>() =&gt; void | undefined</span>
                        <code>undefined</code>
                        <span>
                            Function to close modal. If undefined, modal cannot
                            be closed by user
                        </span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>position</code>
                        <span>'center' | 'bottomRight' | 'bottomSheet'</span>
                        <code>'center'</code>
                        <span>Position of the modal on screen</span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>children</code>
                        <span>ReactNode</span>
                        <code>required</code>
                        <span>Content to display inside the modal</span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>mobileBreakpoint</code>
                        <span>number</span>
                        <code>768</code>
                        <span>
                            Screen width below which mobile behavior is applied
                        </span>
                    </div>
                    <div className={styles.propsRow}>
                        <code>forceBottomSheet</code>
                        <span>boolean</span>
                        <code>false</code>
                        <span>
                            Force bottom sheet behavior on all screen sizes
                        </span>
                    </div>
                </div>
            </section>

            {/* All the modals */}
            {basicModal.isOpen && (
                <Modal close={basicModal.close} title='Basic Modal'>
                    <section className={styles.modalContent}>
                        <p>
                            This is a basic modal with default center
                            positioning.
                        </p>
                        <p>
                            You can close it by clicking the X button, pressing
                            Escape, or clicking outside the modal.
                        </p>
                    </section>
                </Modal>
            )}

            {centerModal.isOpen && (
                <Modal
                    close={centerModal.close}
                    position='center'
                    title='Center Modal'
                >
                    <section className={styles.modalContent}>
                        <p>
                            This modal is explicitly positioned in the center of
                            the screen.
                        </p>
                        <p>
                            It's the default position, so you don't actually
                            need to specify it.
                        </p>
                    </section>
                </Modal>
            )}

            {bottomRightModal.isOpen && (
                <Modal
                    close={bottomRightModal.close}
                    position='bottomRight'
                    title='Bottom Right Modal'
                >
                    <section className={styles.modalContent}>
                        <p>This modal appears in the bottom right corner.</p>
                        <p>
                            Great for notifications or quick actions that don't
                            need full attention.
                        </p>
                    </section>
                </Modal>
            )}

            {bottomSheetModal.isOpen && (
                <Modal
                    close={bottomSheetModal.close}
                    position='bottomSheet'
                    title='Bottom Sheet Modal'
                >
                    <section className={styles.modalContent}>
                        <p>This modal slides up from the bottom as a sheet.</p>
                        <p>
                            On mobile devices, this position is automatically
                            used for better UX.
                        </p>
                        <p>
                            You can drag the handle at the top to close it on
                            touch devices.
                        </p>
                    </section>
                </Modal>
            )}

            {forceBottomSheetModal.isOpen && (
                <Modal
                    close={forceBottomSheetModal.close}
                    forceBottomSheet={true}
                    title='Forced Bottom Sheet'
                >
                    <section className={styles.modalContent}>
                        <p>
                            This modal is forced to be a bottom sheet even on
                            desktop.
                        </p>
                        <p>
                            Useful when you want consistent behavior across all
                            devices.
                        </p>
                    </section>
                </Modal>
            )}

            {autoOpenModal.isOpen && (
                <Modal close={autoOpenModal.close} title='Manual Open Modal'>
                    <div className={styles.modalContent}>
                        <p>
                            This modal was opened manually using
                            modalCtrl.open().
                        </p>
                        <p>
                            You can also use modalCtrl.toggle() to switch
                            states.
                        </p>
                    </div>
                </Modal>
            )}

            <section className={styles.showcaseSection}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2>🧱 Padding Guidelines</h2>
                        <p>
                            Best practices for consistent spacing in Modal
                            components
                        </p>
                    </div>
                    <button
                        className={styles.toggleCode}
                        onClick={() => toggleCode('padding')}
                    >
                        {showCode.padding ? 'Hide Code' : 'Show Code'}
                    </button>
                </div>

                <div className={styles.paddingGuidelines}>
                    <div className={styles.guidelineCard}>
                        <h3>Component-Level Padding</h3>
                        <p>
                            To ensure consistency and flexibility across
                            different modal designs,
                            <strong>
                                {' '}
                                padding should be applied within the individual
                                components rendered inside the modal
                            </strong>
                            , rather than on the modal container itself.
                        </p>
                        <p>
                            This approach allows components to maintain their
                            spacing whether they're used inside or outside of a
                            modal.
                        </p>
                    </div>

                    <div className={styles.guidelineCard}>
                        <h3>Default Modal Padding</h3>
                        <p>
                            For standard padding that should apply across all
                            modals by default, add the following style to your
                            modal container:
                        </p>
                        <code className={styles.inlineCode}>
                            padding: var(--padding-s) var(--padding-m)
                            var(--padding-m) var(--padding-m);
                        </code>
                    </div>

                    <div className={styles.tipCard}>
                        <h4>💡 Tip</h4>
                        <p>
                            Keep component-level padding scoped and intentional.
                            This ensures modularity and prevents layout
                            inconsistencies when reusing components in other
                            contexts.
                        </p>
                    </div>
                </div>

                {showCode.padding && (
                    <CodeBlock title='Padding Best Practices'>
                        {`// ❌ Don't apply padding to modal container
<Modal close={modalCtrl.close} title="Bad Example">
    <div style={{ padding: '24px' }}>
        <MyComponent />
    </div>
</Modal>

// ✅ Apply padding within individual components
function MyModalComponent() {
    return (
        <div style={{ padding: 'var(--modal-padding, 24px)' }}>
            <h3>Component Title</h3>
            <p>Component content with its own padding</p>
        </div>
    );
}

<Modal close={modalCtrl.close} title="Good Example">
    <MyModalComponent />
</Modal>

// ✅ CSS approach for component padding
.myModalComponent {
    padding: var(--modal-padding, 24px);
}

// ✅ Multiple components with different padding needs
<Modal close={modalCtrl.close} title="Flexible Layout">
    <HeaderComponent />  {/* No padding */}
    <ContentComponent /> {/* Standard padding */}
    <ActionBar />        {/* Custom padding */}
</Modal>`}
                    </CodeBlock>
                )}
            </section>

            {longContentModal.isOpen && (
                <Modal
                    close={longContentModal.close}
                    title='Long Content Modal'
                >
                    <div className={styles.longContentModal}>
                        <p>
                            This modal has very long content to demonstrate
                            scrolling behavior.
                        </p>
                        <p>
                            On mobile devices, the content will scroll within
                            the modal.
                        </p>
                        <p>
                            The modal itself won't scroll the background page.
                        </p>
                        {Array.from({ length: 50 }, (_, i) => (
                            <p key={i}>
                                This is paragraph number {i + 1} to create long
                                content.
                            </p>
                        ))}
                        <p>
                            End of long content. You should be able to scroll
                            back up.
                        </p>
                    </div>
                </Modal>
            )}

            {formModal.isOpen && (
                <Modal close={formModal.close} title='Form Modal with Keyboard'>
                    <div style={{ padding: '20px' }}>
                        <p>
                            This modal contains form inputs that demonstrate
                            keyboard handling:
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                marginTop: '16px',
                            }}
                        >
                            <input
                                type='text'
                                placeholder='Text input'
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--bg-dark4)',
                                    background: 'var(--bg-dark3)',
                                    color: 'var(--text1)',
                                    fontSize: '16px',
                                }}
                            />
                            <textarea
                                placeholder='Textarea input'
                                rows={4}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--bg-dark4)',
                                    background: 'var(--bg-dark3)',
                                    color: 'var(--text1)',
                                    fontSize: '16px',
                                    resize: 'vertical',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <SimpleButton bg='green'>Submit</SimpleButton>
                                <SimpleButton
                                    bg='dark4'
                                    onClick={formModal.close}
                                >
                                    Cancel
                                </SimpleButton>
                            </div>
                        </div>
                        <p
                            style={{
                                marginTop: '16px',
                                fontSize: '14px',
                                color: 'var(--text3)',
                            }}
                        >
                            On mobile devices, the modal will adjust when the
                            keyboard appears.
                        </p>
                    </div>
                </Modal>
            )}

            {nestedModal.isOpen && (
                <Modal close={nestedModal.close} title='Outer Modal'>
                    <div className={styles.modalContent}>
                        <p>
                            This is the outer modal. You can open another modal
                            from within this one.
                        </p>
                        <p>
                            This demonstrates that multiple modals can be active
                            simultaneously.
                        </p>
                        <SimpleButton
                            bg='accent2'
                            onClick={innerNestedModal.open}
                        >
                            Switch to Inner Modal
                        </SimpleButton>

                        {innerNestedModal.isOpen && (
                            <Modal
                                close={innerNestedModal.close}
                                title='Inner Modal'
                            >
                                <div className={styles.modalContent}>
                                    <p>
                                        This is the inner modal, nested within
                                        the outer modal.
                                    </p>
                                    <p>
                                        Each modal maintains its own state and
                                        can be controlled independently.
                                    </p>
                                    <SimpleButton
                                        bg='red'
                                        onClick={innerNestedModal.close}
                                    >
                                        Switch to outer Modal
                                    </SimpleButton>
                                </div>
                            </Modal>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
