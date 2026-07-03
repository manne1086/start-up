export default function FeatureGrid() {
  return (
    <section className="max-w-4xl mx-auto mt-24 mb-32 px-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-[#6C47FF] bg-[#12121A] p-6 shadow-[4px_4px_0px_#6C47FF]">
          <h3 className="text-lg font-bold text-white mb-2">Live research-first workflow</h3>
          <p className="text-sm text-[#888899]">Each run should pull market evidence, synthesize a plan, and update downstream modules from backend state.</p>
        </div>
        <div className="border-2 border-[#6C47FF] bg-[#12121A] p-6 shadow-[4px_4px_0px_#6C47FF]">
          <h3 className="text-lg font-bold text-white mb-2">No demo placeholders</h3>
          <p className="text-sm text-[#888899]">The UI now avoids baked-in sample metrics and waits for generation output before rendering data panels.</p>
        </div>
      </div>
    </section>
  );
}
