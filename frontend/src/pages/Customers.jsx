const Customers = () => {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Customers</h1>
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Country</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Customer rows will go here */}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  export default Customers;