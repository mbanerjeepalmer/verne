import VerneLogo from "@/components/icons/verne-logo";

const Navbar = () => {
  return (
    <div className="w-full flex justify-between items-center border px-2 py-1 rounded-md">
      <div className="flex items-center gap-2">
        <VerneLogo className="size-5" />
        <p className="text-lg font-semibold">Verne</p>
      </div>
    </div>
  );
};

export default Navbar;
