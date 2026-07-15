// 입력 필드 래퍼: 라벨 + 자식(input/textarea/버튼 그룹)을 감싼다.

export default function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, opacity: 0.6, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
