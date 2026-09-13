/**
 * The Administration section: the reference data every other screen picks
 * from. Each entry is keyed by its module, and the whole object is spread into
 * the catalogue root so a screen reads `t('rooms.title')` rather than
 * `t('admin.rooms.title')`.
 *
 * `entity` is the singular name used in toasts and buttons — "New Room",
 * "Room created" — and is passed to the shared phrasing in `common`, which is
 * what lets Burmese put the modifier after the noun.
 */
export const admin = {
  departments: {
    entity: 'Department',
    title: 'Departments',
    description: 'Clinical and non-clinical organisational units',
    searchPlaceholder: 'Search by code or name...',
    empty: 'No departments found',
    deleteTitle: 'Delete department',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone. Departments with employees or service centers attached cannot be deleted.',
    column: {
      code: 'Code',
      name: 'Name',
      type: 'Type',
      description: 'Description',
      created: 'Created'
    },
    type: {
      clinical: 'Clinical',
      'non-clinical': 'Non-clinical'
    },
    modal: {
      editTitle: 'Edit department',
      newTitle: 'New department',
      editDescription: 'Update this department.',
      newDescription: 'Add a clinical or non-clinical department.'
    }
  },

  rooms: {
    entity: 'Room',
    title: 'Rooms',
    description: 'Inpatient rooms and their occupancy',
    searchPlaceholder: 'Search by code, name, floor or description...',
    empty: 'No rooms found',
    deleteTitle: 'Delete room',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone. Rooms with admission history cannot be deleted.',
    filterStatus: 'Filter by room status',
    allStatuses: 'All room statuses',
    column: {
      code: 'Code',
      name: 'Name',
      type: 'Type',
      floor: 'Floor',
      beds: 'Beds',
      roomStatus: 'Room status',
      status: 'Status'
    },
    type: {
      general: 'General',
      private: 'Private',
      'semi-private': 'Semi-private',
      deluxe: 'Deluxe',
      icu: 'ICU',
      isolation: 'Isolation'
    },
    roomStatus: {
      available: 'Available',
      occupied: 'Occupied',
      cleaning: 'Cleaning',
      maintenance: 'Maintenance',
      reserved: 'Reserved'
    },
    modal: {
      editTitle: 'Edit room',
      newTitle: 'New room',
      editDescription: 'Update this inpatient room.',
      newDescription: 'Add an admittable inpatient room.'
    },
    form: {
      totalBeds: 'Total beds',
      floor: 'Floor',
      statusLocked: 'Locked while a patient is admitted.',
      activeHint: 'Inactive rooms are hidden from the admission picker.'
    },
    validation: {
      bedsRequired: 'Bed count is required',
      bedsWhole: 'Enter a whole number',
      bedsMin: 'A room needs at least one bed'
    }
  },

  stores: {
    entity: 'Store',
    title: 'Stores',
    description: 'Pharmacies and general stores that hold stock',
    searchPlaceholder: 'Search by code, name or description...',
    empty: 'No stores found',
    deleteTitle: 'Delete store',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone. A store that still holds stock cannot be deleted.',
    column: {
      code: 'Code',
      name: 'Name',
      type: 'Type',
      flags: 'Flags',
      status: 'Status'
    },
    type: {
      medical: 'Medical',
      general: 'General'
    },
    flag: {
      main: 'Main',
      default: 'Default'
    },
    modal: {
      editTitle: 'Edit store',
      newTitle: 'New store',
      editDescription: 'Update this stock-holding location.',
      newDescription: 'Add a pharmacy or general stock-holding location.'
    },
    form: {
      mainStore: 'Main store',
      mainStoreHint: 'Central store that supplies the others.',
      defaultStore: 'Default store',
      defaultStoreHint: 'Pre-selected wherever a store has to be chosen.'
    }
  },

  serviceCenters: {
    entity: 'Service center',
    title: 'Service Centers',
    description: 'Points of care inside each department',
    searchPlaceholder: 'Search by code, name or location...',
    empty: 'No service centers found',
    deleteTitle: 'Delete service center',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone. Service centers referenced by services cannot be deleted.',
    filterDepartment: 'Filter by department',
    allDepartments: 'All departments',
    column: {
      code: 'Code',
      name: 'Name',
      department: 'Department',
      type: 'Type',
      priority: 'Priority',
      status: 'Status'
    },
    priority: {
      primary: 'Primary',
      emergency: 'Emergency'
    },
    modal: {
      editTitle: 'Edit service center',
      newTitle: 'New service center',
      editDescription: 'Update this point of care.',
      newDescription: 'Add a point of care inside a department — an OPD room, a lab, a theatre.'
    },
    form: {
      location: 'Location',
      selectDepartment: 'Select a department',
      selectType: 'Select a type',
      noTypeCategory: 'No "Service Center Type" category configured yet.'
    },
    validation: {
      departmentRequired: 'Department is required',
      typeRequired: 'Type is required'
    }
  },

  services: {
    entity: 'Service',
    title: 'Services',
    description: 'Billable procedures and consultations',
    searchPlaceholder: 'Search by code, name or CPT description...',
    empty: 'No services found',
    deleteTitle: 'Delete service',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone. Services already billed on an invoice cannot be deleted.',
    column: {
      code: 'Code',
      name: 'Name',
      category: 'Category',
      serviceCenter: 'Service center',
      price: 'Price',
      status: 'Status'
    },
    modal: {
      editTitle: 'Edit service',
      newTitle: 'New service',
      editDescription: 'Update this billable procedure or consultation.',
      newDescription: 'Add a billable procedure or consultation.'
    },
    form: {
      price: 'Price',
      cptDescription: 'CPT description',
      specialInstruction: 'Special instruction',
      serviceCenterHint: 'Optional — leave unset for a service any center can bill.',
      selectCategory: 'Select a category',
      noCategory: 'No "Service Category" category configured yet.'
    },
    validation: {
      categoryRequired: 'Category is required',
      priceRequired: 'Price is required',
      priceFormat: 'Enter an amount with at most two decimals'
    }
  },

  vendors: {
    entity: 'Vendor',
    title: 'Vendors',
    description: 'Suppliers goods are purchased from',
    searchPlaceholder: 'Search by code, name, contact or address...',
    empty: 'No vendors found',
    deleteTitle: 'Delete vendor',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone. Vendors referenced by purchase orders or goods receipts cannot be deleted.',
    column: {
      code: 'Code',
      name: 'Name',
      type: 'Type',
      contact: 'Contact',
      currency: 'Currency',
      status: 'Status'
    },
    modal: {
      editTitle: 'Edit vendor',
      newTitle: 'New vendor',
      editDescription: 'Update this supplier.',
      newDescription: 'Add a procurement supplier.'
    },
    form: {
      vendorType: 'Vendor type',
      currency: 'Currency',
      contactNo: 'Contact number',
      billingAddress: 'Billing address',
      selectType: 'Select a type',
      noTypeCategory: 'No "Vendor Type" category configured yet.'
    },
    validation: {
      typeRequired: 'Vendor type is required'
    }
  },

  users: {
    entity: 'User',
    title: 'Users',
    description:
      'Application logins. Accounts disabled by failed logins or inactivity are re-enabled here.',
    searchPlaceholder: 'Search by username or role...',
    empty: 'No users found',
    deleteTitle: 'Delete user',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone, and the records they created keep pointing at the deleted account. Disable the login instead if you only want to block access.',
    self: 'You',
    superUserBadge: 'super user',
    statusUpdated: 'User status updated',
    statusFailed: 'Failed to update user status',
    column: {
      username: 'Username',
      role: 'Role',
      status: 'Status'
    },
    role: {
      admin: 'Admin',
      billing: 'Billing',
      store: 'Store',
      nurse: 'Nurse'
    },
    modal: {
      editTitle: 'Edit user',
      newTitle: 'New user',
      editDescription: 'Update this login.',
      newDescription: 'Create a login for a member of staff.'
    },
    form: {
      username: 'Username',
      password: 'Password',
      passwordKeepHint: 'Leave blank to keep the current password.',
      passwordNewHint: 'At least 8 characters. Shown once — it cannot be read back.',
      role: 'Role',
      activeHint: 'A disabled account cannot sign in.',
      superUser: 'Super user',
      superUserHint: 'Bypasses every permission check.',
      superUserLocked: 'Only a super user can grant this.'
    },
    validation: {
      usernameRequired: 'Username is required',
      passwordRequired: 'Password is required',
      passwordMin: 'Password must be at least 8 characters'
    }
  },

  roles: {
    entity: 'Role',
    title: 'Roles',
    description: "Permission sets. A user's role column is matched against these names.",
    searchPlaceholder: 'Search by role name or description...',
    empty: 'No roles found',
    deleteTitle: 'Delete role',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone. A role still assigned to a user cannot be deleted.',
    column: {
      role: 'Role'
    },
    modal: {
      editTitle: 'Edit role',
      newTitle: 'New role',
      description:
        'Ticked privileges are the complete grant list for this role — anything left unticked is revoked on save. Changes take effect without a restart.'
    },
    permissions: {
      title: 'Permissions',
      selected: '{{selected}} of {{total}} selected',
      noModules: 'No modules registered'
    }
  },

  items: {
    entity: 'Item',
    title: 'Items',
    description: 'Medicines and consumables held in stores',
    searchPlaceholder: 'Search by code, name or generic name...',
    empty: 'No items found',
    deleteTitle: 'Delete item',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone. Items with stock, batches or sale history cannot be deleted — deactivate them instead.',
    column: {
      code: 'Item Code',
      generic: 'Generic',
      uom: 'Base / Sale UOM',
      salePrice: 'Sale Price'
    },
    modal: {
      editTitle: 'Edit item',
      newTitle: 'New item',
      editDescription: 'Update this medicine or consumable.',
      newDescription: 'Add a medicine or consumable to the catalogue.'
    },
    form: {
      itemCode: 'Item code',
      genericName: 'Generic name',
      selectCategory: 'Select a category',
      noCategory: 'No "Item Category" list configured yet.',
      baseUnit: 'Base unit',
      baseUnitHint: 'How stock is held.',
      saleUnit: 'Sale unit',
      saleUnitHint: 'How it is sold.',
      noUom: 'No "UOM" list configured yet.',
      selectUnit: 'Select a unit',
      conversionFactor: 'Conversion factor',
      conversionHint: 'Base units in one sale unit — 1 box of 10 tablets is 10.',
      salePrice: 'Sale price',
      openInStores: 'Open in stores',
      openInStoresHint:
        'An item can only hold stock in a store it has been opened in. Each store starts at zero quantity.',
      loadingStores: 'Loading stores...',
      noStores: 'No stores configured yet.',
      drug: 'Drug',
      drugHint: 'Classifies the item as a drug rather than a material.',
      unitsLocked:
        'Fixed once this item has stock or stock history — every quantity ever recorded against it is read in these units. Set up a new item to correct them.'
    },
    units: {
      title: 'Units',
      description:
        'The units this item can be keyed in. Add the unit it is bought in — a carton — and a goods received note can be entered in cartons instead of being converted by hand.',
      base: 'base',
      sale: 'sale',
      baseUnitFallback: 'base units',
      purchaseDefault: 'purchase default',
      makeDefault: 'Use for purchases',
      newUnit: 'Add a unit',
      factor: 'Factor',
      factorHint: 'How many {{unit}} one of it holds.',
      price: 'Sale price',
      priceHint: 'Leave blank for a unit that is bought but not sold.',
      notSold: 'not sold in',
      add: 'Add',
      added: 'Unit added',
      removed: 'Unit removed',
      defaultSet: 'Purchase unit set',
      remove: 'Remove {{unit}}'
    },
    validation: {
      codeRequired: 'Item code is required',
      categoryRequired: 'Category is required',
      baseUnitRequired: 'Base unit is required',
      saleUnitRequired: 'Sale unit is required',
      priceRequired: 'Sale price is required',
      priceFormat: 'Enter an amount with at most two decimals',
      conversionRequired: 'Conversion factor is required',
      conversionPositive: 'Enter a number above zero'
    }
  },

  lookups: {
    listEntity: 'List',
    optionEntity: 'Option',
    title: 'Lookup Lists',
    description: 'The option lists the rest of the app chooses from',
    newList: 'New List',
    newOption: 'New Option',
    lists: 'Lists',
    noLists: 'No lists yet.',
    choosePrompt: 'Choose a list on the left to see its options.',
    optionCount_one: '{{count}} option',
    optionCount_other: '{{count}} options',
    emptyOptions: 'No options in {{list}} yet',
    renameAria: 'Rename {{name}}',
    defaultBadge: 'default',
    column: {
      option: 'Option',
      order: 'Order'
    },
    deleteListTitle: 'Delete list',
    deleteListBody:
      'Delete "{{name}}"? A list that still has options cannot be deleted — remove them first. Forms that look this list up by name will have nothing to offer once it is gone.',
    deleteOptionTitle: 'Delete option',
    deleteOptionBody:
      'Delete "{{name}}"? Records already pointing at it keep the reference, so this is refused if any do.',
    categoryModal: {
      editTitle: 'Rename list',
      newTitle: 'New list',
      editDescription:
        'Other screens look this list up by name, so renaming it can stop them finding their options.',
      newDescription: 'Add a list of options other screens can choose from.'
    },
    entityModal: {
      editTitle: 'Edit option',
      newTitle: 'New option',
      sortOrder: 'Sort order',
      sortHint: 'Lower numbers come first in the dropdowns.',
      sortWhole: 'Enter a whole number',
      defaultOption: 'Default option',
      defaultHint: 'Marks this as the usual choice for its list.'
    }
  },

  employees: {
    entity: 'Employee',
    title: 'Employees',
    description: 'Doctors, nurses and general staff',
    searchPlaceholder: 'Search by employee no, name, phone or email...',
    empty: 'No employees found',
    deleteTitle: 'Delete employee',
    deleteBody:
      'Delete "{{name}}"? This cannot be undone. Staff attached to visits, orders or consultant fees cannot be deleted — deactivate them instead.',
    column: {
      employeeNo: 'Employee No',
      name: 'Name',
      category: 'Category',
      department: 'Department',
      status: 'Status'
    },
    category: {
      doctor: 'Doctor',
      nurse: 'Nurse',
      general: 'General staff'
    },
    modal: {
      editTitle: 'Edit employee',
      newTitle: 'New employee',
      editDescription: 'Update this staff record.',
      newDescription: 'Add a doctor, nurse or general staff member.'
    },
    section: {
      employment: 'Employment',
      personal: 'Personal details',
      contact: 'Contact',
      nrc: 'NRC'
    },
    form: {
      employeeNumber: 'Employee number',
      department: 'Department',
      selectDepartment: 'Select a department',
      category: 'Category',
      categoryHint: 'Doctors are the only staff the consultant pickers offer.',
      employmentStatus: 'Employment status',
      qualification: 'Qualification',
      activeHint: 'Inactive staff stay on file but drop out of the pickers.',
      fullName: 'Full name',
      shortName: 'Short name',
      shortNameHint: 'Shown where the full name will not fit.',
      fatherName: "Father's name",
      gender: 'Gender',
      dob: 'Date of birth',
      age: 'Age',
      maritalStatus: 'Marital status',
      phoneNo: 'Phone number',
      state: 'State / Region',
      township: 'Township',
      townshipHint: 'Choose a state first',
      stateNumber: 'State number',
      nrcHint: 'Leave the whole section blank if the NRC is not on file.',
      district: 'District',
      districtHint: 'Choose a state number first',
      nrcType: 'Type',
      nrcNo: 'NRC number'
    },
    validation: {
      employeeNoRequired: 'Employee number is required',
      fullNameRequired: 'Full name is required',
      departmentRequired: 'Department is required',
      invalidEmail: 'Enter a valid email address',
      invalidDate: 'Enter a valid date',
      dobFuture: 'Date of birth cannot be in the future'
    }
  }
} as const;
