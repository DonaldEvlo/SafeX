import React from 'react';

const LogsTable = () => {
  const auditLogs = [
    {
      timestamp: '2024-03-15 14:30:00',
      user: 'Alex Bennett',
      action: 'Message Sent',
      details: 'Sent message to Group A'
    },
    {
      timestamp: '2024-03-15 14:25:00',
      user: 'Jordan Carter',
      action: 'Login',
      details: 'Successful login'
    },
    {
      timestamp: '2024-03-15 14:20:00',
      user: 'Riley Davis',
      action: 'Group Created',
      details: "Created group 'Project X'"
    },
    {
      timestamp: '2024-03-15 14:15:00',
      user: 'Morgan Evans',
      action: 'User Added',
      details: "Added user 'Riley Davis' to Group A"
    },
    {
      timestamp: '2024-03-15 14:10:00',
      user: 'Alex Bennett',
      action: 'Message Read',
      details: 'Read message in Group A'
    },
    {
      timestamp: '2024-03-15 14:05:00',
      user: 'Jordan Carter',
      action: 'Logout',
      details: 'User logged out'
    },
    {
      timestamp: '2024-03-15 14:00:00',
      user: 'Riley Davis',
      action: 'Message Sent',
      details: 'Sent message to Group B'
    },
    {
      timestamp: '2024-03-15 13:55:00',
      user: 'Morgan Evans',
      action: 'Group Settings Updated',
      details: 'Updated settings for Group A'
    },
    {
      timestamp: '2024-03-15 13:50:00',
      user: 'Alex Bennett',
      action: 'Message Sent',
      details: 'Sent message to Group A'
    },
    {
      timestamp: '2024-03-15 13:45:00',
      user: 'Jordan Carter',
      action: 'Login',
      details: 'Successful login'
    }
  ];

  const navItems = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
          <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z" />
        </svg>
      ),
      label: 'Dashboard',
      active: false
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
          <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z" />
        </svg>
      ),
      label: 'Users',
      active: false
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
          <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z" />
        </svg>
      ),
      label: 'Groups',
      active: false
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
          <path d="M168,112a56,56,0,1,1-56-56A56,56,0,0,1,168,112Zm61.66,117.66a8,8,0,0,1-11.32,0l-50.06-50.07a88,88,0,1,1,11.32-11.31l50.06,50.06A8,8,0,0,1,229.66,229.66ZM112,184a72,72,0,1,0-72-72A72.08,72.08,0,0,0,112,184Z" />
        </svg>
      ),
      label: 'Audit Logs',
      active: true
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z" />
        </svg>
      ),
      label: 'Settings',
      active: false
    }
  ];

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-900 text-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
          {/* Sidebar */}
          <div className="layout-content-container flex flex-col w-80">
            <div className="flex h-full min-h-[700px] flex-col justify-between bg-slate-900 p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <h1 className="text-white text-base font-medium leading-normal">SafeX Admin</h1>
                  <p className="text-slate-400 text-sm font-normal leading-normal">Admin Panel</p>
                </div>
                <div className="flex flex-col gap-2">
                  {navItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 px-3 py-2 ${
                        item.active ? 'rounded-full bg-slate-700' : ''
                      }`}
                    >
                      <div className="text-white w-6 h-6">
                        {item.icon}
                      </div>
                      <p className="text-white text-sm font-medium leading-normal">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <div className="flex min-w-72 flex-col gap-3">
                <p className="text-white tracking-light text-[32px] font-bold leading-tight">Audit Logs</p>
                <p className="text-slate-400 text-sm font-normal leading-normal">
                  Monitor real-time activities and events within the SafeX messaging app.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                  <div className="text-slate-400 flex bg-slate-700 items-center justify-center pl-4 rounded-l-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                    </svg>
                  </div>
                  <input
                    placeholder="Search logs"
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-slate-700 focus:border-none h-full placeholder:text-slate-400 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    defaultValue=""
                  />
                </div>
              </label>
            </div>

            {/* Audit Logs Table */}
            <div className="px-4 py-3">
              <div className="flex overflow-hidden rounded-xl border border-slate-600 bg-slate-900">
                <table className="flex-1">
                  <thead>
                    <tr className="bg-slate-800">
                      <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, index) => (
                      <tr key={index} className="border-t border-t-slate-600">
                        <td className="h-[72px] px-4 py-2 w-[400px] text-slate-400 text-sm font-normal leading-normal">
                          {log.timestamp}
                        </td>
                        <td className="h-[72px] px-4 py-2 w-[400px] text-white text-sm font-normal leading-normal">
                          {log.user}
                        </td>
                        <td className="h-[72px] px-4 py-2 w-[400px] text-slate-400 text-sm font-normal leading-normal">
                          {log.action}
                        </td>
                        <td className="h-[72px] px-4 py-2 w-[400px] text-slate-400 text-sm font-normal leading-normal">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsTable;