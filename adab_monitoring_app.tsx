import React, { useState } from 'react';
import { Download, Plus, X, Users, CheckCircle, XCircle } from 'lucide-react';

const AdabMonitoringApp = () => {
  const [userRole, setUserRole] = useState('guru');
  const [selectedClass, setSelectedClass] = useState('7A');
  const [selectedMonth, setSelectedMonth] = useState('2025-10');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState('');

  // Data tugas adab
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Mengucapkan salam saat masuk kelas' },
    { id: 2, name: 'Berdoa sebelum belajar' },
    { id: 3, name: 'Merapikan meja dan kursi' },
    { id: 4, name: 'Membuang sampah pada tempatnya' },
    { id: 5, name: 'Berbicara dengan sopan kepada guru' }
  ]);

  // Data kelas
  const classes = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'];

  // Data murid (contoh)
  const [students] = useState({
    '7A': [
      { id: 1, name: 'Ahmad Fauzi' },
      { id: 2, name: 'Siti Nurhaliza' },
      { id: 3, name: 'Budi Santoso' },
      { id: 4, name: 'Dewi Lestari' },
      { id: 5, name: 'Eko Prasetyo' }
    ],
    '7B': [
      { id: 6, name: 'Fitri Rahmawati' },
      { id: 7, name: 'Gilang Ramadhan' }
    ]
  });

  // Data pengisian adab murid (simulasi)
  const [studentProgress, setStudentProgress] = useState({});

  // Fungsi tambah tugas
  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), name: newTask }]);
      setNewTask('');
      setShowAddTask(false);
    }
  };

  // Fungsi hapus tugas
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Fungsi toggle pengisian adab
  const toggleAdab = (studentId, taskId, date) => {
    const key = `${studentId}-${taskId}-${date}`;
    setStudentProgress({
      ...studentProgress,
      [key]: !studentProgress[key]
    });
  };

  // Fungsi hitung persentase kelas
  const calculateClassPercentage = (className) => {
    const classStudents = students[className] || [];
    if (classStudents.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    let totalChecked = 0;
    const totalPossible = classStudents.length * tasks.length;

    classStudents.forEach(student => {
      tasks.forEach(task => {
        const key = `${student.id}-${task.id}-${today}`;
        if (studentProgress[key]) totalChecked++;
      });
    });

    return totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0;
  };

  // Fungsi export data
  const exportData = () => {
    const classData = students[selectedClass] || [];
    let csvContent = "Nama Murid," + tasks.map(t => t.name).join(',') + "\n";

    classData.forEach(student => {
      let row = student.name + ",";
      const taskResults = tasks.map(task => {
        const key = `${student.id}-${task.id}-${new Date().toISOString().split('T')[0]}`;
        return studentProgress[key] ? 'Ya' : 'Tidak';
      });
      row += taskResults.join(',');
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `adab_${selectedClass}_${selectedMonth}.csv`;
    link.click();
  };

  // Tampilan untuk Murid
  const StudentView = () => {
    const today = new Date().toISOString().split('T')[0];
    const studentId = 1; // Simulasi student ID yang login

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Pengisian Adab Harian</h2>
          <p className="text-green-100">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Checklist Adab Hari Ini</h3>
          <div className="space-y-3">
            {tasks.map(task => {
              const key = `${studentId}-${task.id}-${today}`;
              const isChecked = studentProgress[key];

              return (
                <div
                  key={task.id}
                  onClick={() => toggleAdab(studentId, task.id, today)}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`flex-1 ${isChecked ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                    {task.name}
                  </span>
                  {isChecked ? (
                    <CheckCircle className="text-green-500" size={24} />
                  ) : (
                    <XCircle className="text-gray-300" size={24} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Tampilan untuk Guru/Admin
  const TeacherView = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Dashboard Monitoring Adab</h2>
          <p className="text-blue-100">Kelola dan monitor adab siswa</p>
        </div>

        {/* Kelola Tugas Adab */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Daftar Tugas Adab</h3>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
              Tambah Tugas
            </button>
          </div>

          {showAddTask && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Nama tugas adab baru..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />
              <div className="flex gap-2">
                <button
                  onClick={addTask}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <span className="text-gray-700">
                  {index + 1}. {task.name}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rekapan Persentase per Kelas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <Users size={24} />
            Rekapan Persentase Pengisian per Kelas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map(className => {
              const percentage = calculateClassPercentage(className);
              return (
                <div key={className} className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Kelas {className}</span>
                    <span className="text-2xl font-bold text-purple-600">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {students[className]?.length || 0} siswa
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Data */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Export Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {classes.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Bulan</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={exportData}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download size={20} />
                Export ke CSV
              </button>
            </div>
          </div>
        </div>

        {/* Data Murid per Kelas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Data Pengisian - Kelas {selectedClass}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama Murid</th>
                  {tasks.map(task => (
                    <th key={task.id} className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {task.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(students[selectedClass] || []).map(student => {
                  const today = new Date().toISOString().split('T')[0];
                  return (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{student.name}</td>
                      {tasks.map(task => {
                        const key = `${student.id}-${task.id}-${today}`;
                        const isChecked = studentProgress[key];
                        return (
                          <td key={task.id} className="px-4 py-3 text-center">
                            {isChecked ? (
                              <CheckCircle className="inline text-green-500" size={20} />
                            ) : (
                              <XCircle className="inline text-gray-300" size={20} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header dengan Switch Role */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Sistem Monitoring Adab
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setUserRole('murid')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  userRole === 'murid'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Murid
              </button>
              <button
                onClick={() => setUserRole('guru')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  userRole === 'guru'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Guru/Admin
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {userRole === 'murid' ? <StudentView /> : <TeacherView />}
      </div>
    </div>
  );
};

export default AdabMonitoringApp;