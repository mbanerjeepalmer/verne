interface IProps {
  className?: string;
}

const VerneLogo = ({ className }: IProps) => {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g
        fill="none"
        stroke="black"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="60" cy="60" r="44" />

        <path d="M35 40 L60 80 L85 40" />

        <path d="M25 60 A35 35 0 0 1 95 60" />
      </g>
    </svg>
  );
};

export default VerneLogo;
