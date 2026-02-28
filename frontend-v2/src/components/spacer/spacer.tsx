type SpacerSize = "xsmall" | "small" | "medium" | "large" | "xlarge";

interface IProps {
  size?: SpacerSize;
}

const sizeClasses: Record<SpacerSize, string> = {
  xsmall: "py-1",
  small: "py-2",
  medium: "py-4",
  large: "py-6",
  xlarge: "py-8",
};

const Spacer = ({ size = "medium" }: IProps) => {
  return <div className={sizeClasses[size]} />;
};

export default Spacer;
