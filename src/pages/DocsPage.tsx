import { DOCS_URL } from '../config/env'

export default function DocsPage() {
    return (
        <div className="docs-container" style={{ height: 'calc(100vh - 120px)', width: '100%', overflow: 'hidden', borderRadius: '12px', background: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <iframe
                src={DOCS_URL}
                title="Documentation Portal"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                }}
            />
        </div>
    )
}
