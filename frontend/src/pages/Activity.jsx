const Activity = () => {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Activity</h1>
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-left">BD</th>
              </tr>
            </thead>
            <tbody>
              {/* Activity rows will go here */}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

export default Activity;