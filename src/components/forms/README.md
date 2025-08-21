# Form Components Documentation

This directory contains reusable form components with consistent styling and proper contrast for accessibility.

## Available Components

### Input Component

A reusable input component with proper contrast styling and consistent theming.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Label text displayed above the input |
| `error` | string | - | Error message to display (makes border red) |
| `helperText` | string | - | Helper text shown below input (hidden when error is present) |
| `required` | boolean | false | Shows red asterisk next to label |
| `variant` | 'default' \| 'modern' | 'default' | Styling variant (modern has more rounded corners) |
| `className` | string | '' | Additional CSS classes for the input |
| `containerClassName` | string | '' | Additional CSS classes for the container div |
| All standard input props | - | - | type, name, value, onChange, placeholder, etc. |

#### Usage Examples

```jsx
import { Input } from '../../components/forms';

// Basic usage
<Input
  type="email"
  name="email"
  value={email}
  onChange={handleChange}
  label="Email Address"
  placeholder="Enter your email"
  required
/>

// With error state
<Input
  type="password"
  name="password"
  value={password}
  onChange={handleChange}
  label="Password"
  error="Password is required"
  required
/>

// With helper text
<Input
  type="password"
  name="password"
  value={password}
  onChange={handleChange}
  label="Password"
  helperText="Minimum 6 characters required"
  variant="modern"
  minLength={6}
  required
/>
```

### TextArea Component

A reusable textarea component with similar styling and props as the Input component.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Label text displayed above the textarea |
| `error` | string | - | Error message to display (makes border red) |
| `helperText` | string | - | Helper text shown below textarea (hidden when error is present) |
| `required` | boolean | false | Shows red asterisk next to label |
| `variant` | 'default' \| 'modern' | 'default' | Styling variant (modern has more rounded corners) |
| `rows` | number | 4 | Number of textarea rows |
| `className` | string | '' | Additional CSS classes for the textarea |
| `containerClassName` | string | '' | Additional CSS classes for the container div |
| All standard textarea props | - | - | name, value, onChange, placeholder, etc. |

#### Usage Examples

```jsx
import { TextArea } from '../../components/forms';

// Basic usage
<TextArea
  name="description"
  value={description}
  onChange={handleChange}
  label="Description"
  placeholder="Enter description..."
  rows={6}
/>

// With error state
<TextArea
  name="bio"
  value={bio}
  onChange={handleChange}
  label="Bio"
  error="Bio is required"
  required
/>

// Modern variant with helper text
<TextArea
  name="content"
  value={content}
  onChange={handleChange}
  label="Content"
  helperText="Describe your content in detail"
  variant="modern"
  rows={8}
/>
```

## Styling Features

### Consistent Theme
- Uses purple (`#7C3AED`) focus rings and accents
- Proper contrast with dark gray text (`text-gray-900`) on white backgrounds
- Gray placeholder text (`placeholder:text-gray-500`)

### Accessibility
- High contrast ratios for text readability
- Focus indicators with visible focus rings
- Proper label associations
- Error state indicators

### Variants
- **Default**: Standard rounded corners (`rounded-lg`)
- **Modern**: More rounded corners (`rounded-xl`) for contemporary look

### States
- **Normal**: Gray border with purple focus ring
- **Error**: Red border and focus ring with error text
- **Disabled**: Reduced opacity (handled by browser defaults)

## Import

```jsx
// Import individual components
import { Input, TextArea } from '../../components/forms';

// Or import specific component
import Input from '../../components/forms/Input';
import TextArea from '../../components/forms/TextArea';
```

## Integration with Form Libraries

These components work seamlessly with form libraries like React Hook Form:

```jsx
import { useForm } from 'react-hook-form';
import { Input, TextArea } from '../../components/forms';

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('email', { required: 'Email is required' })}
        label="Email"
        error={errors.email?.message}
        type="email"
      />
      
      <TextArea
        {...register('description')}
        label="Description"
        placeholder="Enter description..."
      />
    </form>
  );
}
```
