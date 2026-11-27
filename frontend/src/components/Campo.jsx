// Label + input para não repetir isso em todo formulário
export default function Campo({ label, area, ...props }) {
    return (
        <label>
            {label}
            {area ? <textarea rows="2" {...props} /> : <input {...props} />}
        </label>
    );
}
