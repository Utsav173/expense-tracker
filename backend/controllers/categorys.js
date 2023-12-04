const { Category } = require('../models/Category');

const categoryController = {
  find: async (req, res) => {
    try {
      const {
        search,
        sortBy = 'name',
        sortOrder = 'asc',
        page = 1,
        limit = 10,
      } = req.query;

      // Define the initial query to filter by search term if provided
      const query = search ? { name: { $regex: new RegExp(search, 'i') } } : {};

      // Define the sort options based on sortBy and sortOrder
      const sortOptions = {};
      if (sortBy && sortOrder) {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }

      // Calculate skip and limit for pagination
      const skip = (page - 1) * limit;
      const total = await Category.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      // Find categories with search, sort, and pagination options
      const categories = await Category.find(query, 'id name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        categories,
        pagination: {
          total,
          totalPages,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { name } = req.body;
      const isExists = await Category.findOne({ name });

      if (isExists) {
        return res.status(409).json({ message: 'Category already exists' });
      }

      const categoryData = await Category.create({ name });
      return res.status(200).json(categoryData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: 'Category ID is required' });
      }

      const categoryData = await Category.findByIdAndDelete(id);

      if (!categoryData) {
        return res.status(404).json({ message: 'Category not found' });
      }

      return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ error: error.message });
    }
  },

  edit: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: 'Category ID is required' });
      }

      const { name } = req.body;
      const categoryData = await Category.findByIdAndUpdate(
        id,
        { name },
        { new: true }
      );

      if (!categoryData) {
        return res.status(404).json({ message: 'Category not found' });
      }

      return res.status(200).json({ message: 'Category updated successfully' });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = categoryController;
