<?php

namespace Pouce\SuperAdminBundle\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\Form\Extension\Core\ChoiceList\ChoiceList;

use Pouce\SiteBundle\Entity\Edition;

class EditionType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            -> add('dateOfEvent', 'date', array(
            'input'  => 'datetime',
            'widget' => 'choice'
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'pouce_superAdminbundle_edition';
    }
}
