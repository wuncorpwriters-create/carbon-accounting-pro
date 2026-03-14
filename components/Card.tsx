type CardProps = {
  title?: string;
  children: React.ReactNode;
};

export default function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h3>{title}</h3>
        </div>
      )}

      <div className="card-body">{children}</div>
    </div>
  );
}