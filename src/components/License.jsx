import packageJson from "../../package.json";

const License = () => {
  return (
    <>
    <section className="px-6 text-sm border-t border-gray-200 bg-white shadow-sm w-full h-14 flex justify-between items-center text-gray-500">
      <span>
        © 2026 CheerClub Converter - All Rights Reserved
        </span>
        <span>
          v {packageJson.version}
        </span>
    </section>
    </>
  );
};

export default License;
