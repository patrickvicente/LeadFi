const Leads = () => {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Leads</h1>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Add Lead
          </button>
        </div>
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Lead rows will go here */}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  export default Leads;