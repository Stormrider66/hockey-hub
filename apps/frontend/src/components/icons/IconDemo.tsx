import React from 'react';
import {
  Plus,
  Save,
  Edit,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from './index';

export const IconDemo: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Custom Icon System Demo</h2>
      
      {/* Basic Icons */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Basic Icons</h3>
        <div className="flex gap-4 items-center">
          <Plus size={24} />
          <Save size={24} />
          <Edit size={24} />
          <Trash2 size={24} />
          <Download size={24} />
          <Upload size={24} />
        </div>
      </section>

      {/* Different Sizes */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Different Sizes</h3>
        <div className="flex gap-4 items-center">
          <Plus size={16} />
          <Plus size={20} />
          <Plus size={24} />
          <Plus size={32} />
        </div>
      </section>

      {/* With Colors */}
      <section>
        <h3 className="text-lg font-semibold mb-2">With Colors</h3>
        <div className="flex gap-4 items-center">
          <Save color="green" size={24} />
          <Edit color="blue" size={24} />
          <Trash2 color="red" size={24} />
          <CheckCircle color="#10b981" size={24} />
          <AlertCircle color="#ef4444" size={24} />
        </div>
      </section>

      {/* With Tailwind Classes */}
      <section>
        <h3 className="text-lg font-semibold mb-2">With Tailwind Classes</h3>
        <div className="flex gap-4 items-center">
          <Save className="text-green-500 hover:text-green-600 transition-colors" size={24} />
          <Edit className="text-blue-500 hover:text-blue-600 transition-colors" size={24} />
          <Trash2 className="text-red-500 hover:text-red-600 transition-colors" size={24} />
        </div>
      </section>

      {/* In Buttons */}
      <section>
        <h3 className="text-lg font-semibold mb-2">In Buttons</h3>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            <Plus size={20} />
            Add New
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            <Save size={20} />
            Save
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            <Trash2 size={20} />
            Delete
          </button>
        </div>
      </section>

      {/* Interactive Example */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Interactive Example</h3>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
        >
          Dropdown Menu
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {isOpen && (
          <div className="mt-2 p-4 border rounded">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={20} />
                Successfully connected
              </div>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={20} />
                Error: Connection failed
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};