import Spacer from "../spacer/spacer";
import Navbar from "./navbar/navbar";

interface IProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: IProps) => {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-200 flex flex-col justify-center items-center">
        <Spacer size="small" />
        <Navbar />
        <Spacer size="small" />
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
