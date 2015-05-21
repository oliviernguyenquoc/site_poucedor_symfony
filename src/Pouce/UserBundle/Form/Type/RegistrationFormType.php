<?php

// src/Pouce/UserBundle/Form/Type/RegistrationFormType.php

namespace Pouce\UserBundle\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;

class RegistrationFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        parent::buildForm($builder, $options);
        
        // add your custom field
        $builder
            ->add('first_name')
            ->add('last_name')
            ->add('sex')
            ->add('promotion')
            ->add('telephone');
    }

    public function getParent()
    {
        return 'fos_user_registration';
    }

    public function getName()
    {
        return 'pouce_user_registration';
    }
}