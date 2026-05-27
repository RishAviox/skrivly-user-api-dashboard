export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          <p>Coming soon</p>
        </div>
      </div>
    </section>
  )
}

